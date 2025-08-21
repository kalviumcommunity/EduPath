import express from 'express';
import { getRecommendations, previewRecommendations } from '../controllers/recommend.controller.js';
import { auth } from '../middleware/auth.middleware.js';
import { checkRecommendLimit } from '../middleware/limit.middleware.js';

const router = express.Router();

// Protected routes
router.post('/', auth, checkRecommendLimit, getRecommendations);
router.post('/preview', auth, previewRecommendations);

export default router;
