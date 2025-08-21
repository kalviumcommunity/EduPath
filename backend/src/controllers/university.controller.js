import University from '../models/university.model.js';
import { logger } from '../utils/logger.js';

// Get all universities with filtering
export const getUniversities = async (req, res, next) => {
  try {
    const { field, state, budgetMax, limit = 10, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build filter
    const filter = {};
    
    if (field) {
      filter['courses.field'] = field;
    }
    
    if (state) {
      filter['location.state'] = state;
    }
    
    if (budgetMax) {
      filter['courses.annualFee'] = { $lte: parseInt(budgetMax) };
    }
    
    // Execute query
    const universities = await University.find(filter)
      .sort({ 'benchmarks.ranking': 1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    // Get total count for pagination
    const total = await University.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      data: {
        universities,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get university by ID
export const getUniversityById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const university = await University.findById(id);
    
    if (!university) {
      res.status(404);
      throw new Error('University not found');
    }
    
    res.status(200).json({
      success: true,
      data: university
    });
  } catch (error) {
    next(error);
  }
};

// Quick count endpoint to verify seeding
export const getUniversityCount = async (req, res, next) => {
  try {
    const total = await University.countDocuments();
    res.status(200).json({ success: true, data: { total } });
  } catch (error) {
    next(error);
  }
};
