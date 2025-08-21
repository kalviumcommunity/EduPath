import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';
import { sanitizeUserInput } from '../utils/ai.utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AIService {
  constructor() {
    this.provider = process.env.AI_PROVIDER || 'mock';
    this.model = process.env.MODEL_NAME || 'gemini-pro';
    this.apiKey = process.env.GEMINI_API_KEY;
    this.recommendPromptVersion = process.env.PROMPT_VERSION_RECOMMEND || 'recommendation.v1';
    this.chatPromptVersion = process.env.PROMPT_VERSION_CHAT || 'chat.v1';
  this.timeoutMs = parseInt(process.env.AI_TIMEOUT_MS) || 8000; // configurable LLM timeout
  this.maxRecommendTokens = parseInt(process.env.AI_MAX_REC_TOKENS) || 800; // rec max tokens
  this.maxChatTokens = parseInt(process.env.AI_MAX_CHAT_TOKENS) || 500; // chat max tokens
  this.enableRetry = (process.env.AI_RETRY === '1');
    
    // Initialize in-memory cache
    this.cache = new Map();
    // Model name normalization (older env values -> current Gemini names)
    if (this.model === 'gemini-pro') {
      this.model = 'gemini-1.5-pro-latest';
    } else if (this.model === 'gemini-pro-vision') {
      this.model = 'gemini-1.5-flash';
    }
  }
  
  // Load prompt template from file
  async loadPromptTemplate(version) {
    try {
      const promptPath = path.join(__dirname, '..', 'prompts', `${version}.txt`);
      const template = fs.readFileSync(promptPath, 'utf-8');
      return template;
    } catch (error) {
      logger.error(`Failed to load prompt template: ${error.message}`);
      // Fallback to default templates
      if (version.includes('recommendation')) {
        return this.getDefaultRecommendationPrompt();
      } else {
        return this.getDefaultChatPrompt();
      }
    }
  }
  
  // Default recommendation prompt if file not found
  getDefaultRecommendationPrompt() {
    return `System Role: You are an expert, empathetic, and encouraging student counsellor. Your goal is to help a 12th-grade student feel confident and excited about their future.

User Profile:
{{profile}}

Retrieved University Data:
Here are the top universities from our database that match the student's core preferences:
{{universities}}

Task:
Write a personalized and encouraging note to the student.
1. Start with a warm greeting.
2. Analyze their profile and acknowledge their strengths.
3. Based ONLY on the provided university data, recommend these universities.
4. For each university, explain WHY it's a great fit for THIS student, directly referencing their priorities and the university's key features.
5. Avoid content not in provided data.
6. Conclude with an optimistic and empowering statement about their bright future.`;
  }
  
  // Default chat prompt if file not found
  getDefaultChatPrompt() {
    return `System Role: You are an expert, empathetic, and encouraging student counsellor. Your goal is to help a 12th-grade student navigate their university options and answer their questions.

{{context}}

Conversation History:
{{history}}

Current User Question:
{{message}}

Task:
Respond helpfully to the student's question. Be factual, supportive, and encouraging. Only reference universities that were mentioned in the provided context.`;
  }
  
  // Build recommendation prompt
  async buildRecommendationPrompt(profile, universities) {
    const template = await this.loadPromptTemplate(this.recommendPromptVersion);
    
    // Format profile for prompt
    const profileSection = `
- Academics: { "grade12Score": ${profile.academics?.grade12Score || 'N/A'}, "board": "${profile.academics?.board || 'N/A'}" }
- Interests: { "fieldOfStudy": "${profile.interests?.fieldOfStudy || 'N/A'}", "courses": [${(profile.interests?.courses || []).map(c => `"${sanitizeUserInput(c)}"`).join(', ')}] }
- Preferences: { "locations": [${(profile.preferences?.locations || []).map(l => `"${sanitizeUserInput(l)}"`).join(', ')}], "budget": ${profile.preferences?.budget || 'N/A'}, "priorities": [${(profile.preferences?.priorities || []).map(p => `"${sanitizeUserInput(p)}"`).join(', ')}] }
    `;
    
    // Format universities for prompt
  const safeUniversities = Array.isArray(universities) ? universities : [];
  const universitiesSection = safeUniversities.length ? safeUniversities.map((uni, index) => `
${index + 1}. **${uni.name}**: { "placementPercentage": ${uni.placementPercentage}, "averageSalary": ${uni.averageSalary}, "annualFee": ${uni.annualFee}, "keyFeatures": [${uni.keyFeatures.map(f => `"${sanitizeUserInput(f)}"`).join(', ')}], "ranking": "${uni.ranking}" }
  `).join('') : 'No matching universities found based on current filters.';
    
    // Replace placeholders
    return template
      .replace('{{profile}}', profileSection)
      .replace('{{universities}}', universitiesSection);
  }
  
  // Build chat prompt
  async buildChatPrompt(message, context = {}, history = []) {
    const template = await this.loadPromptTemplate(this.chatPromptVersion);
    
    // Format context
    const contextSection = context.recommendedUniversities ? `
Recommended Universities:
${context.recommendedUniversities.map((uni, index) => `
${index + 1}. **${uni.name}**: Located in ${uni.location}, ranked ${uni.ranking}. Known for ${uni.keyFeatures.slice(0, 3).join(', ')}.
`).join('')}
    ` : '';
    
    // Format history (last 3 turns only)
    const historySection = history.slice(-3).map(turn => `
User: ${sanitizeUserInput(turn.message)}
AI: ${sanitizeUserInput(turn.reply)}
    `).join('');
    
    // Replace placeholders
    return template
      .replace('{{context}}', contextSection)
      .replace('{{history}}', historySection)
      .replace('{{message}}', sanitizeUserInput(message));
  }
  
  // Generate counsellor note using Gemini API
  async generateCounsellorNote(prompt) {
    logger.info(`AI provider in use: ${this.provider}`);
    if (this.provider === 'mock' || !this.apiKey) {
      return this.mockCounsellorNote(prompt, { reason: this.provider === 'mock' ? 'provider=mock' : 'missing_api_key' });
    }

    const startTime = Date.now();

    const attempt = async () => {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: this.maxRecommendTokens,
            topP: 0.9
          }
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: this.timeoutMs
        }
      );
      return response;
    };

    try {
      let response;
      try {
        response = await attempt();
      } catch (err) {
        if (this.enableRetry) {
          logger.warn(`Gemini first attempt failed (${err.message}). Retrying once...`);
          await new Promise(r => setTimeout(r, 120 + Math.random()*180));
          response = await attempt();
        } else {
          throw err;
        }
      }
      const latency = Date.now() - startTime;
      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!text) throw new Error('Empty Gemini response');
      return {
        text,
        modelMeta: {
          model: this.model,
          tokensIn: Math.round(prompt.length / 4),
          tokensOut: Math.round(text.length / 4),
          latencyMs: latency,
          provider: 'gemini'
        }
      };
    } catch (error) {
      logger.error(`Gemini API error: ${error.message}`);
      const fallback = this.mockCounsellorNote(prompt, { reason: error.message });
      fallback.modelMeta.provider = 'mock-fallback';
  logger.warn({ provider: this.provider, model: this.model, reason: error.message }, 'Using mock fallback for counsellor note');
      return fallback;
    }
  }
  
  // Generate chat response using Gemini API
  async generateChatResponse(prompt) {
    logger.info(`AI provider in use: ${this.provider}`);
    if (this.provider === 'mock' || !this.apiKey) {
      return this.mockChatResponse(prompt, { reason: this.provider === 'mock' ? 'provider=mock' : 'missing_api_key' });
    }
    const startTime = Date.now();

    const attempt = async () => {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: this.maxChatTokens,
            topP: 0.9
          }
        },
        { headers: { 'Content-Type': 'application/json' }, timeout: this.timeoutMs }
      );
      return response;
    };
    try {
      let response;
      try {
        response = await attempt();
      } catch (err) {
        if (this.enableRetry) {
          logger.warn(`Gemini chat first attempt failed (${err.message}). Retrying...`);
          await new Promise(r => setTimeout(r, 100 + Math.random()*150));
          response = await attempt();
        } else {
          throw err;
        }
      }
      const latency = Date.now() - startTime;
      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!text) throw new Error('Empty Gemini response');
      return {
        text,
        modelMeta: {
          model: this.model,
          tokensIn: Math.round(prompt.length / 4),
          tokensOut: Math.round(text.length / 4),
          latencyMs: latency,
          provider: 'gemini'
        }
      };
    } catch (error) {
      logger.error(`Gemini Chat API error: ${error.message}`);
      const fallback = this.mockChatResponse(prompt, { reason: error.message });
      fallback.modelMeta.provider = 'mock-fallback';
  logger.warn({ provider: this.provider, model: this.model, reason: error.message }, 'Using mock fallback for chat response');
      return fallback;
    }
  }
  
  // Mock counsellor note for development/testing
  mockCounsellorNote(prompt, meta = {}) {
    // Extract student name and fields from prompt
    const nameMatch = prompt.match(/name:\s*"([^"]+)"/i);
    const fieldMatch = prompt.match(/fieldOfStudy":\s*"([^"]+)"/i);
    const prioritiesMatch = prompt.match(/priorities":\s*\[(.*?)\]/i);
    
    const studentName = nameMatch ? nameMatch[1] : 'student';
    const fieldOfStudy = fieldMatch ? fieldMatch[1] : 'your chosen field';
    let priorities = ['placements', 'faculty', 'campus life'];
    if (prioritiesMatch) {
      const rawPriorityItems = prioritiesMatch[1].match(/"([^"]+)"/g);
      if (rawPriorityItems && rawPriorityItems.length) {
        priorities = rawPriorityItems.map(p => p.replace(/"/g, ''));
      }
    }
    
    // Extract university names from prompt
    const universityMatches = prompt.match(/\*\*([^*]+)\*\*/g) || [];
    const universities = (Array.isArray(universityMatches) ? universityMatches : [])
      .map(u => u.replace(/\*\*/g, ''))
      .slice(0, 3);
    
    return {
      text: `
Dear ${studentName},

I'm thrilled to help you explore your options for higher education in ${fieldOfStudy}. Based on your academic achievements and interests, you're well-positioned for success!

Based on your priorities (${priorities.join(', ')}), I've identified these universities that align perfectly with your goals:

${universities.map((uni, i) => `${i + 1}. **${uni}** - This institution stands out for its excellent ${priorities[0] || 'placements'} and ${priorities[1] || 'faculty'}. Their ${fieldOfStudy} program is highly regarded and matches your academic profile.`).join('\n\n')}

Remember, each of these universities offers unique opportunities that align with your interests. I encourage you to explore their websites and reach out to current students to get a better feel for campus life.

Stay confident—your preparation positions you strongly for success wherever you choose to go!
      `,
      modelMeta: {
        model: 'mock-model',
        tokensIn: Math.round(prompt.length / 4),
        tokensOut: 500,
        latencyMs: 150,
        provider: 'mock',
        fallbackReason: meta.reason || null
      }
    };
  }
  
  // Mock chat response for development/testing
  mockChatResponse(prompt, meta = {}) {
    // Extract question from prompt
    const questionMatch = prompt.match(/Current User Question:\s*([^\n]+)/i);
    const question = questionMatch ? questionMatch[1] : '';
    
    // Extract universities from context
    const universityMatches = prompt.match(/\*\*([^*]+)\*\*/g) || [];
    const universities = universityMatches.map(u => u.replace(/\*\*/g, '')).slice(0, 3);
    
    // Generate response based on common questions
    let response = '';
    
    if (question.toLowerCase().includes('placement') || question.toLowerCase().includes('job')) {
      response = `Regarding placements, ${universities[0] || 'the recommended universities'} has an excellent placement record with top companies regularly recruiting from campus. The placement percentage is typically above 90% with competitive starting salaries.`;
    } else if (question.toLowerCase().includes('fee') || question.toLowerCase().includes('cost') || question.toLowerCase().includes('afford')) {
      response = `Regarding tuition fees, ${universities[0] || 'these universities'} offers various financial aid options including scholarships based on merit and need. I'd recommend checking their financial aid office website for the most current information about eligibility criteria.`;
    } else if (question.toLowerCase().includes('hostel') || question.toLowerCase().includes('accommodation') || question.toLowerCase().includes('campus')) {
      response = `Most students at ${universities[0] || 'these universities'} stay in on-campus hostels, especially in their first year. The accommodations are generally well-maintained with options for different budgets. Campus life is vibrant with numerous clubs and activities to participate in.`;
    } else {
      response = `That's a good question! Based on the universities I recommended, ${universities.join(', ')}, I would suggest exploring their official websites for the most accurate and up-to-date information. Is there a specific aspect about these universities you'd like to know more about?`;
    }
    
    return {
      text: response,
      modelMeta: {
        model: 'mock-model',
        tokensIn: Math.round(prompt.length / 4),
        tokensOut: Math.round(response.length / 4),
        latencyMs: 100,
        provider: 'mock',
        fallbackReason: meta.reason || null
      }
    };
  }
}

// Create and export singleton instance
const aiService = new AIService();
export default aiService;
