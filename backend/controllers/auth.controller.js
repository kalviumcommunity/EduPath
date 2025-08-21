import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/user.model.js';
import { logger } from '../utils/logger.js';
import { mapField } from '../utils/fieldMap.js';

const ACCESS_TOKEN_TTL = '45m'; // extended from 15m
const REFRESH_TOKEN_TTL_DAYS = 7;

function signAccessToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
}

function generateRefreshToken() {
  return crypto.randomBytes(48).toString('hex');
}

async function persistRefreshToken(user, token) {
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  user.refreshTokens.push({ token, expiresAt });
  // Prune expired tokens
  user.refreshTokens = user.refreshTokens.filter(rt => rt.expiresAt > new Date());
  await user.save();
  return expiresAt;
}

// Register a new user
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400);
      throw new Error('User already exists');
    }
    
    // Create new user
    const user = await User.create({
      name,
      email,
      password
    });
    
  // Generate tokens
  const token = signAccessToken(user._id);
  const refreshToken = generateRefreshToken();
  await persistRefreshToken(user, refreshToken);
    
    // Send response
    res.status(201).json({
      success: true,
      data: {
  token,
  refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Login user
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401);
      throw new Error('Invalid credentials');
    }
    
    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401);
      throw new Error('Invalid credentials');
    }
    
  // Generate tokens
  const token = signAccessToken(user._id);
  const refreshToken = generateRefreshToken();
  await persistRefreshToken(user, refreshToken);
    
    // Send response
    res.status(200).json({
      success: true,
      data: {
  token,
  refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get current user profile
export const getCurrentUser = async (req, res, next) => {
  try {
    const user = req.user;
    
    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: user.profile,
        limits: {
          recommend: {
            used: user.recommendCounts.count,
            limit: parseInt(process.env.RECOMMEND_DAILY_LIMIT) || 10,
            remaining: Math.max(0, (parseInt(process.env.RECOMMEND_DAILY_LIMIT) || 10) - user.recommendCounts.count)
          },
          chat: {
            used: user.chatCounts.count,
            limit: parseInt(process.env.CHAT_DAILY_LIMIT) || 30,
            remaining: Math.max(0, (parseInt(process.env.CHAT_DAILY_LIMIT) || 30) - user.chatCounts.count)
          }
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update user profile
export const updateUserProfile = async (req, res, next) => {
  try {
    const { profile } = req.body;
    const userId = req.user._id;
    // Normalize incoming flat profile shape to nested (interests/preferences)
    const normalizedProfile = normalizeProfile(profile);
    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profile: normalizedProfile },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        profile: updatedUser.profile
      }
    });
  } catch (error) {
    next(error);
  }
};

// Helper to normalize flat profile structure similar to recommend controller logic
function normalizeProfile(raw) {
  if (!raw) return raw;
  if (raw.interests || raw.preferences) return raw; // already nested
  const mappedField = mapField(raw.field || raw.fieldOfStudy);
  const loc = raw.location;
  const locations = loc ? [loc] : [];
  return {
    academics: raw.academics || {
      grade12Score: raw.academics?.grade12Score || raw.gpa || null,
      board: raw.academics?.board || null
    },
    interests: {
      fieldOfStudy: mappedField,
      courses: raw.courses || []
    },
    preferences: {
      locations,
      budget: raw.budget || null,
      priorities: raw.priorities || []
    }
  };
}

// Refresh access token
export const refreshAccessToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400);
      throw new Error('Refresh token required');
    }
    const user = await User.findOne({ 'refreshTokens.token': refreshToken });
    if (!user) {
      res.status(401);
      throw new Error('Invalid refresh token');
    }
    // Validate not expired
    const stored = user.refreshTokens.find(rt => rt.token === refreshToken);
    if (!stored || stored.expiresAt < new Date()) {
      // Remove expired
      user.refreshTokens = user.refreshTokens.filter(rt => rt.token !== refreshToken);
      await user.save();
      res.status(401);
      throw new Error('Refresh token expired');
    }
    const newAccess = signAccessToken(user._id);
    res.status(200).json({ success: true, data: { token: newAccess } });
  } catch (error) {
    next(error);
  }
};
