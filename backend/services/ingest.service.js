import axios from 'axios';
import University from '../models/university.model.js';
import { logger } from '../utils/logger.js';
import { mapField } from '../utils/fieldMap.js';

/*
  Ingestion service: fetch universities by country using Hipolabs public API
  (http://universities.hipolabs.com/search?country=Country+Name)
  We map minimal fields; enrich with placeholder benchmarks so scoring works.
*/
export async function ingestCountryUniversities(country, opts = {}) {
  const countryTrim = (country||'').trim();
  if (!countryTrim) throw new Error('country required');
  const userBudget = typeof opts.budget === 'number' && opts.budget > 0 ? opts.budget : null;
  const requestedField = (opts.field || '').toString().trim();
  const canonicalField = mapField(requestedField) || 'General Studies';
  const existingCount = await University.countDocuments({ 'location.country': countryTrim });
  if (existingCount > 25) {
    // Before skipping, attempt field enrichment if this field underrepresented
    const fieldDocs = await University.countDocuments({ 'location.country': countryTrim, 'courses.field': canonicalField });
    let enriched = 0;
    if (fieldDocs < 5) {
      const need = 5 - fieldDocs;
      const carriers = await University.find({ 'location.country': countryTrim }).limit(need).exec();
      for (const uni of carriers) {
        const hasField = uni.courses.some(c => c.field === canonicalField);
        if (!hasField) {
          const fee = Math.max(15000, Math.round((userBudget ? Math.min(userBudget*0.8,userBudget):35000) * (0.75 + Math.random()*0.4)));
          uni.courses.push({ name: canonicalField, field: canonicalField, annualFee: fee });
          await uni.save();
          enriched += 1;
        }
      }
      if (enriched) {
        logger.info({ country: countryTrim, field: canonicalField, enriched }, 'Field enrichment added courses to existing universities');
      }
    }
    logger.info({ country: countryTrim, existingCount, skipped: true, fieldExisting: fieldDocs, enriched }, 'Skipping primary ingestion; country already populated');
    return { ingested: 0, skipped: true, enriched };
  }
  const url = `http://universities.hipolabs.com/search?country=${encodeURIComponent(countryTrim)}`;
  const resp = await axios.get(url, { timeout: 8000 });
  const list = Array.isArray(resp.data) ? resp.data.slice(0, 50) : [];
  const baseFee = userBudget ? Math.min(userBudget * 0.8, userBudget) : 35000; // try to keep within budget
  const docs = list.map(u => {
    const fee = Math.max(15000, Math.round(baseFee * (0.75 + Math.random()*0.4))); // 75%-115% of base
    return {
      name: u.name,
      location: { city: u['state-province'] || '', state: u['state-province'] || '', country: countryTrim },
      courses: [ { name: canonicalField, field: canonicalField, annualFee: fee } ],
      benchmarks: { placementPercentage: 70 + Math.round(Math.random()*20), averageSalary: 600000 + Math.round(Math.random()*300000), ranking: 40 + Math.round(Math.random()*120) },
      type: 'academics-focused',
      keyFeatures: ['International collaboration','Diverse programs','Global student body']
    };
  });
  // Upsert by name+country to avoid duplicates
  let ingested = 0;
  for (const doc of docs) {
    const existing = await University.findOne({ name: doc.name, 'location.country': countryTrim });
    if (!existing) {
      await University.create(doc);
      ingested += 1;
    } else if (userBudget) {
      // Adjust overly expensive fees to be within ~120% of budget
      const avgFee = existing.courses.reduce((s,c)=>s+c.annualFee,0)/ existing.courses.length;
      if (avgFee > userBudget*1.2) {
        existing.courses = existing.courses.map(c=> ({ ...c, annualFee: Math.round(userBudget* (0.85 + Math.random()*0.25)) }));
        await existing.save();
      }
    }
  }
  logger.info({ country: countryTrim, ingested }, 'Ingestion complete');
  return { ingested, skipped: false };
}
