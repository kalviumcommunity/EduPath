import express from 'express';
import aiService from '../services/ai.service.js';
import { auth } from '../middleware/auth.middleware.js';
import { ingestCountryUniversities } from '../services/ingest.service.js';

const router = express.Router();

// Quick AI health & provider status (auth required to avoid public key probing)
router.get('/health', auth, async (req,res) => {
  const summary = {
    provider: aiService.provider,
    model: aiService.model,
    hasApiKey: Boolean(aiService.apiKey),
    cacheEntries: aiService.cache.size
  };
  res.status(200).json({ success: true, data: summary });
});

// Ingest universities for a country (on-demand)
router.post('/ingest', auth, async (req,res,next) => {
  try {
    const { country } = req.body;
    const result = await ingestCountryUniversities(country);
    res.status(200).json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
});

export default router;
