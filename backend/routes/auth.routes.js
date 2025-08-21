import express from 'express';
import { registerUser, loginUser, getCurrentUser, updateUserProfile, refreshAccessToken } from '../controllers/auth.controller.js';
import { auth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh', refreshAccessToken);

// Protected routes
router.get('/me', auth, getCurrentUser);
router.put('/me/profile', auth, updateUserProfile);

export default router;
