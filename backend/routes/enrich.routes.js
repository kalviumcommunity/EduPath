import express from 'express';
import { auth } from '../middleware/auth.middleware.js';
import { ingestCountryUniversities } from '../services/ingest.service.js';
import { mapField } from '../utils/fieldMap.js';
import University from '../models/university.model.js';

const router = express.Router();

// GET /api/enrich?country=Germany&field=Science&budget=40000
router.get('/', auth, async (req, res, next) => {
  try {
    const { country, field, budget } = req.query;
    if (!country) return res.status(400).json({ success:false, error:'country required'});
    const canonicalField = mapField(field);
    const result = await ingestCountryUniversities(country, { budget: budget? parseInt(budget): undefined, field: canonicalField, force: true });
    const counts = {
      countryTotal: await University.countDocuments({ 'location.country': country }),
      fieldCount: canonicalField ? await University.countDocuments({ 'location.country': country, 'courses.field': canonicalField }) : null
    };
    res.json({ success:true, data: { country, field: canonicalField, result, counts } });
  } catch (e) {
    next(e);
  }
});

export default router;
