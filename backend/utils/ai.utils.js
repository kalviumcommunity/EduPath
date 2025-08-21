import crypto from 'crypto';
import { logger } from './logger.js';

// Normalize university data for consistent scoring
export const normalizeUniversityData = (universities) => {
  if (!universities || universities.length === 0) {
    return [];
  }
  
  // Find min/max values for normalization
  const maxSalary = Math.max(...universities.map(u => u.benchmarks?.averageSalary || 0));
  const minSalary = Math.min(...universities.map(u => u.benchmarks?.averageSalary || 0));
  const maxRanking = Math.max(...universities.map(u => u.benchmarks?.ranking || 100));
  
  // Find best fee efficiency (higher placement % / lower fee = better)
  const feeEfficiencies = universities.map(u => {
    const avgFee = u.courses.reduce((sum, c) => sum + c.annualFee, 0) / u.courses.length;
    return (u.benchmarks?.placementPercentage || 0) / avgFee;
  });
  const bestFeeEfficiency = Math.max(...feeEfficiencies, 0.00001); // Avoid division by zero
  
  return universities.map((uni, index) => {
    // Calculate normalized values
    const placementNorm = (uni.benchmarks?.placementPercentage || 0) / 100;
    
    const salaryNorm = maxSalary === minSalary ? 
      0.5 : // If all same, give neutral score
      ((uni.benchmarks?.averageSalary || 0) - minSalary) / (maxSalary - minSalary);
    
    const rankingNorm = uni.benchmarks?.ranking ? 
      1 - ((uni.benchmarks.ranking - 1) / (maxRanking - 1)) : 
      0;
    
    const avgFee = uni.courses.reduce((sum, c) => sum + c.annualFee, 0) / uni.courses.length;
    const feeEfficiency = (uni.benchmarks?.placementPercentage || 0) / avgFee;
    const feeEfficiencyScaled = Math.min(feeEfficiency / bestFeeEfficiency, 1);
    
    return {
      ...uni,
      _normalized: {
        placementNorm,
        salaryNorm,
        rankingNorm,
        feeEfficiencyScaled,
        feeEfficiency
      }
    };
  });
};

// Score universities based on normalized data
export const scoreUniversities = (universities, userPreferences) => {
  if (!universities || universities.length === 0) {
    return [];
  }
  
  const rawPriorities = userPreferences?.priorities || [];
  const priorityMap = {
    'academic reputation': 'Reputation',
    'reputation': 'Reputation',
    'placements': 'Placements',
    'career services & job placement': 'Placements',
    'career services': 'Placements',
    'job placement': 'Placements',
    'cost & financial aid': 'Affordability',
    'affordability': 'Affordability',
    'research opportunities': 'Research',
    'diversity & inclusion': 'Diversity'
  };
  const priorities = rawPriorities.map(p => priorityMap[p.toLowerCase()] || p);
  
  const weightedUniversities = universities.map(uni => {
    // Default weights
    const weights = {
      placement: 0.35,
      salary: 0.25,
      ranking: 0.20,
      feeEfficiency: 0.10,
      featureMatch: 0.10
    };
    
    // Adjust weights based on user priorities
    if (priorities.includes('Placements')) {
      weights.placement += 0.05;
      weights.salary += 0.05;
      weights.ranking -= 0.05;
      weights.feeEfficiency -= 0.05;
    }
    
    if (priorities.includes('Affordability')) {
      weights.feeEfficiency += 0.10;
      weights.salary -= 0.05;
      weights.ranking -= 0.05;
    }
    
    if (priorities.includes('Reputation')) {
      weights.ranking += 0.10;
      weights.placement -= 0.05;
      weights.feeEfficiency -= 0.05;
    }
    
    // Calculate feature match score
    const keyFeatures = uni.keyFeatures || [];
    const featureMatchCount = priorities.filter(p => 
      keyFeatures.some(f => f.toLowerCase().includes(p.toLowerCase()))
    ).length;
    const featureMatchScore = priorities.length ? featureMatchCount / priorities.length : 0;
    
    // Calculate weighted score
    const score = 
      weights.placement * uni._normalized.placementNorm +
      weights.salary * uni._normalized.salaryNorm +
      weights.ranking * uni._normalized.rankingNorm +
      weights.feeEfficiency * uni._normalized.feeEfficiencyScaled +
      weights.featureMatch * featureMatchScore;
    
    return {
      ...uni,
      _score: score,
      _debugMeta: {
        weights,
        featureMatchScore,
        priorityMatches: priorities.filter(p => 
          keyFeatures.some(f => f.toLowerCase().includes(p.toLowerCase()))
        )
      }
    };
  });
  
  // Sort by score descending
  return weightedUniversities.sort((a, b) => b._score - a._score);
};

// Generate hash for profile for caching purposes
export const generateProfileHash = (profile) => {
  const normalized = JSON.stringify(profile);
  return crypto.createHash('sha256').update(normalized).digest('hex');
};

// Sanitize university data for prompt
export const sanitizeUniversitiesForPrompt = (universities, limit = 7) => {
  return universities.slice(0, limit).map(uni => {
    const avgFee = uni.courses.reduce((sum, c) => sum + c.annualFee, 0) / uni.courses.length;
    
    return {
      name: uni.name,
      location: `${uni.location.city}, ${uni.location.state}`,
      placementPercentage: uni.benchmarks?.placementPercentage || 'N/A',
      averageSalary: uni.benchmarks?.averageSalary || 'N/A',
      annualFee: Math.round(avgFee / 1000) * 1000, // Round to nearest thousand
      ranking: uni.benchmarks?.ranking || 'N/A',
      keyFeatures: uni.keyFeatures || [],
      priorityMatches: uni._debugMeta?.priorityMatches || []
    };
  });
};

// Clean and validate user input
export const sanitizeUserInput = (input) => {
  if (typeof input !== 'string') return '';
  
  // Remove control characters and backticks
  return input
    .replace(/[\\`]/g, '')
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
    .trim();
};
