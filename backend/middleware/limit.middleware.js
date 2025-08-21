import { logger } from '../utils/logger.js';

// Middleware to check recommendation limit
export const checkRecommendLimit = async (req, res, next) => {
  try {
    const user = req.user;
    const limit = parseInt(process.env.RECOMMEND_DAILY_LIMIT) || 10;
    
    // Check if limit exceeded
    if (user.recommendCounts.count >= limit) {
      res.status(429);
      throw new Error(`Daily recommendation limit of ${limit} exceeded`);
    }
    
    // Increment count
    user.recommendCounts.count += 1;
    await user.save();
    
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware to check chat limit
export const checkChatLimit = async (req, res, next) => {
  try {
    const user = req.user;
    const limit = parseInt(process.env.CHAT_DAILY_LIMIT) || 30;
    
    // Check if limit exceeded
    if (user.chatCounts.count >= limit) {
      res.status(429);
      throw new Error(`Daily chat limit of ${limit} exceeded`);
    }
    
    // Increment count
    user.chatCounts.count += 1;
    await user.save();
    
    next();
  } catch (error) {
    next(error);
  }
};
