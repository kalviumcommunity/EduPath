import express from 'express';
import { getChatResponse } from '../controllers/chat.controller.js';
import { auth } from '../middleware/auth.middleware.js';
import { checkChatLimit } from '../middleware/limit.middleware.js';

const router = express.Router();

// Protected routes
router.post('/', auth, checkChatLimit, getChatResponse);

export default router;
