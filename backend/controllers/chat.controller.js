import aiService from '../services/ai.service.js';
import { logger } from '../utils/logger.js';

// Generate AI chat response
export const getChatResponse = async (req, res, next) => {
  try {
    const { message, context = {}, history = [] } = req.body;
    
    // Validate request
    if (!message || message.trim() === '') {
      res.status(400);
      throw new Error('Message is required');
    }
    
    // Build chat prompt
    const prompt = await aiService.buildChatPrompt(message, context, history);
    
    // Generate AI response
  const { text: reply, modelMeta } = await aiService.generateChatResponse(prompt);
    
    // Send response
    res.status(200).json({
      success: true,
      data: {
        reply,
        modelMeta
      }
    });
  } catch (error) {
    // If AI service fails, return fallback response
    if (error.message.includes('AI') || error.message.includes('timeout')) {
      logger.error(`AI chat service failed: ${error.message}`);
      
      // Fallback chat response
      const fallbackReply = `I apologize, but I'm having trouble processing your request at the moment. Could you please try again in a few moments? In the meantime, you might find helpful information on the university websites or by contacting their admissions offices directly.`;
      
      return res.status(200).json({
        success: true,
        data: {
          reply: fallbackReply,
          isFallback: true,
          modelMeta: { provider: aiService.provider, model: aiService.model, fallback: true }
        }
      });
    } else {
      next(error);
    }
  }
};
