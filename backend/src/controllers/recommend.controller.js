import University from "../models/university.model.js";
import Recommendation from "../models/recommendation.model.js";
import aiService from "../services/ai.service.js";
import { logger } from "../utils/logger.js";
import {
  normalizeUniversityData,
  scoreUniversities,
  sanitizeUniversitiesForPrompt,
  generateProfileHash,
} from "../utils/ai.utils.js";
import { rerankByEmbedding } from "../services/embedding.service.js";
import { ingestCountryUniversities } from "../services/ingest.service.js";
import { normalizeLocations } from "../utils/locationMap.js";

// Get university recommendations with AI-generated note
export const getRecommendations = async (req, res, next) => {
  try {
    let { profile } = req.body;
    const { noCache, forceIngest } = req.query || {};
    const userId = req.user._id;
    // Normalize legacy / flat profile shapes coming from frontend
    if (profile && (!profile.interests || !profile.preferences)) {
      profile = normalizeIncomingProfile(profile);
    }

    // Check for cached recommendations
    // Canonicalize locations (order / case agnostic) for hashing & diagnostics
    const canonicalProfile = JSON.parse(JSON.stringify(profile || {}));
    if (canonicalProfile?.preferences?.locations) {
      canonicalProfile.preferences.locations = [
        ...new Set(
          canonicalProfile.preferences.locations.map((l) => (l || "").trim())
        ),
      ]
        .filter(Boolean)
        .map((l) => l.toLowerCase());
      canonicalProfile.preferences.locations.sort();
    }
    const profileHash = generateProfileHash(canonicalProfile);
    const cacheKey = `recommend:${userId}:${profileHash}`;
    const cacheTtlMs =
      (parseInt(process.env.CACHE_PROFILE_TTL_MIN) || 1440) * 60 * 1000;

    // Check for cache hit
    const cachedRecommendation = aiService.cache.get(cacheKey);
    if (
      !noCache &&
      cachedRecommendation &&
      Date.now() - cachedRecommendation.timestamp < cacheTtlMs
    ) {
      logger.info(`Cache hit for recommendation: ${cacheKey}`);
      return res.status(200).json({
        success: true,
        data: {
          aiCounsellorNote: cachedRecommendation.aiCounsellorNote,
          recommendedUniversities: cachedRecommendation.recommendedUniversities,
          fromCache: true,
          modelMeta: cachedRecommendation.modelMeta,
          isFallback: cachedRecommendation.isFallback,
          dataSourceNote: cachedRecommendation.dataSourceNote,
          diagnostics: cachedRecommendation.diagnostics,
        },
      });
    }

    // Step 1: Filter universities based on hard constraints
    const { interests, preferences } = profile;
    if (preferences && Array.isArray(preferences.locations)) {
      preferences.locations = normalizeLocations(preferences.locations);
    }
    // Attempt dynamic ingestion for all distinct country-like locations before querying
    const relaxationSteps = [];
    const ingestionFailures = [];
    const requestedLocations = Array.isArray(preferences?.locations)
      ? preferences.locations.filter(Boolean)
      : [];
    const countryLike = [];
    if (requestedLocations.length) {
      for (const locRaw of requestedLocations) {
        const loc = (locRaw || "").trim();
        if (!loc) continue;
        // Country-like heuristic: alphabetic length > 3 and contains no digits
        if (/^[a-zA-Z][a-zA-Z\s'-]{3,}$/.test(loc)) {
          countryLike.push(loc);
          if (forceIngest || true) {
            // always attempt light ingestion; ingest service should de-dupe
            try {
              await ingestCountryUniversities(loc, {
                budget: preferences?.budget,
                force: !!forceIngest,
                field: interests?.fieldOfStudy,
              });
            } catch (e) {
              logger.warn({ loc, err: e.message }, "Country ingestion failed");
              ingestionFailures.push({ country: loc, error: e.message });
            }
          }
        }
      }
    }

    // Build initial filter
    let filter = {};

    // Field of study filter
    if (interests?.fieldOfStudy) {
      filter["courses.field"] = interests.fieldOfStudy;
    }

    // Location filter
    if (preferences?.locations && preferences.locations.length > 0) {
      filter["$or"] = [
        { "location.country": { $in: preferences.locations } }, // put country first to prioritize
        { "location.state": { $in: preferences.locations } },
        { "location.city": { $in: preferences.locations } },
      ];
    }

    // Budget filter
    if (preferences?.budget) {
      filter["courses.annualFee"] = { $lte: preferences.budget };
    }

    // Query universities
    let universities = await University.find(filter).lean();
    if (!Array.isArray(universities)) universities = [];

    // Field enrichment check: if explicit country requested AND field specified AND we have enough total universities for that country
    if (countryLike.length === 1 && interests?.fieldOfStudy) {
      const countryName = countryLike[0];
      const countryTotal = await University.countDocuments({ 'location.country': countryName });
      const fieldCount = await University.countDocuments({ 'location.country': countryName, 'courses.field': interests.fieldOfStudy });
      if (countryTotal > 0 && fieldCount < 5) {
        try {
          await ingestCountryUniversities(countryName, { budget: preferences?.budget, field: interests.fieldOfStudy, force: true });
          relaxationSteps.push(`fieldEnrichment(${interests.fieldOfStudy})`);
          universities = await University.find(filter).lean();
          if (!Array.isArray(universities)) universities = [];
        } catch (e) {
          relaxationSteps.push(`fieldEnrichmentFailed:${e.message}`);
        }
      }
    }

  const MIN_RESULTS = 5;
    // Relaxation strategy: 1) small budget stretch 2) field broaden 3) drop location LAST
    if (universities.length < MIN_RESULTS) {
      if (preferences?.budget) {
        const originalBudget = preferences.budget;
        filter["courses.annualFee"] = { $lte: originalBudget * 1.1 };
        universities = await University.find(filter).lean();
        if (!Array.isArray(universities)) universities = [];
        relaxationSteps.push("budget+10%");
      }
    }
    if (universities.length < MIN_RESULTS) {
      if (filter["courses.field"]) {
        delete filter["courses.field"];
        universities = await University.find(filter).lean();
        if (!Array.isArray(universities)) universities = [];
        relaxationSteps.push("dropField");
      }
    }
    if (universities.length < MIN_RESULTS) {
      if (filter["$or"]) {
        if (!countryLike.length) {
          delete filter["$or"];
          universities = await University.find(filter).lean();
          if (!Array.isArray(universities)) universities = [];
          relaxationSteps.push("dropLocation");
          // After dropping location we may still be below MIN_RESULTS; fallbackAny allowed then
          if (universities.length < MIN_RESULTS) {
            universities = await University.find({}).limit(MIN_RESULTS).lean();
            if (!Array.isArray(universities)) universities = [];
            relaxationSteps.push("fallbackAny");
          }
        } else {
          relaxationSteps.push("keptLocation(strictCountry)");
        }
      }
    }
    // Strict country mode: if explicit country and still zero, return early (no cross-country pollution)
    if (countryLike.length === 1 && universities.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          aiCounsellorNote: `No universities for ${countryLike[0]} matching the current field and budget yet. Try broadening budget slightly or a related field; data will auto-enrich soon.`,
          recommendedUniversities: [],
          modelMeta: { provider: aiService.provider, model: aiService.model, strictCountry: true },
          isFallback: false,
          dataSourceNote: `0 results for country=${countryLike[0]} after enrichment steps: ${relaxationSteps.join('>')}`,
          diagnostics: { relaxationSteps, requestedLocations, countryLike, countryMatchCount: 0, strictNoCrossCountry: true }
        }
      });
    }

    // Step 2: Score and rank universities
    const normalizedUniversities = normalizeUniversityData(universities);
    let scoredUniversities = scoreUniversities(
      normalizedUniversities,
      preferences
    );
    // Location (country) boost: +5% score if university country among requested country-like tokens
    if (countryLike.length) {
      const countryLc = countryLike.map((c) => c.toLowerCase());
      scoredUniversities = scoredUniversities
        .map((u) => {
          const uniCountry = (u.location?.country || "").toLowerCase();
          if (uniCountry && countryLc.includes(uniCountry)) {
            u._score = u._score * 1.05; // mild multiplicative boost
            u._debugMeta = { ...(u._debugMeta || {}), locationBoost: true };
          }
          return u;
        })
        .sort((a, b) => b._score - a._score);
    }

    // If we still have mixture of countries but enough requested-country matches, filter out others
    if (countryLike.length) {
      const requestedLc = new Set(countryLike.map((c) => c.toLowerCase()));
      const matchesRequested = scoredUniversities.filter(
        (u) =>
          u.location?.country &&
          requestedLc.has(u.location.country.toLowerCase())
      );
      if (matchesRequested.length > 0) {
        const before = scoredUniversities.length;
        scoredUniversities = matchesRequested;
        relaxationSteps.push(
          `prunedNonRequestedCountries(${before}->${scoredUniversities.length})`
        );
      }
    }
    // Optional embedding-based rerank (feature-flagged)
    try {
      scoredUniversities = await rerankByEmbedding(profile, scoredUniversities);
    } catch (e) {
      logger.warn({ err: e.message }, "Embedding rerank skipped");
    }

    // Limit to top 7 universities
    const topUniversities = scoredUniversities.slice(0, 7);

    // Step 3: Prepare universities for prompt
    const promptUniversities = sanitizeUniversitiesForPrompt(topUniversities);

    // Step 4: Generate AI recommendation
    let aiNote = "";
    let modelMeta = {};
    let isFallback = false;
    if (promptUniversities.length === 0) {
      aiNote =
        "No strong matches found with current preferences. Try broadening location, increasing budget, or selecting a different field to see more options.";
      modelMeta = {
        provider: aiService.provider,
        model: aiService.model,
        tokensIn: 0,
        tokensOut: 0,
        latencyMs: 0,
        emptyUniversities: true,
      };
      logger.warn(
        { filter, universitiesFound: universities.length },
        "No universities passed filtering for profile"
      );
    } else {
      const prompt = await aiService.buildRecommendationPrompt(
        profile,
        promptUniversities
      );
      const aiResult = await aiService.generateCounsellorNote(prompt);
      aiNote = aiResult.text;
      modelMeta = aiResult.modelMeta;
      // Safety Guard: strip / neutralize university names not in recommended list
      try {
        const allowedNames = new Set(promptUniversities.map((u) => u.name));
        aiNote = aiNote.replace(/\*\*([^*]+)\*\*/g, (match, name) => {
          return allowedNames.has(name.trim()) ? match : "";
        });
      } catch (safetyErr) {
        logger.warn("Safety guard failed: " + safetyErr.message);
      }
    }

    // Step 5: Save recommendation to database
    const recommendation = await Recommendation.create({
      userId,
      profileSnapshot: profile,
      universityIds: topUniversities.map((uni) => uni._id),
      aiCounsellorNote: aiNote,
      modelMeta,
    });

    // Prepare response data
    const recommendedUniversities = topUniversities
      .filter(Boolean)
      .map((uni) => ({
        id: uni._id,
        name: uni.name,
        location:
          `${uni.location.city || ""}${uni.location.city ? ", " : ""}${
            uni.location.state || ""
          }${
            uni.location.country
              ? (uni.location.city || uni.location.state ? ", " : "") +
                uni.location.country
              : ""
          }`
            .trim()
            .replace(/^[,\s]+|[,\s]+$/g, "") || null,
        matchScore: Math.round(uni._score * 100),
        placementRate: uni.benchmarks?.placementPercentage,
        avgSalary: uni.benchmarks?.averageSalary,
        annualFee:
          uni.courses.reduce((sum, c) => sum + c.annualFee, 0) /
          uni.courses.length,
        ranking: uni.benchmarks?.ranking,
        tags: uni.keyFeatures.slice(0, 3),
        keyFeatures: uni.keyFeatures,
        debugMeta: uni._debugMeta,
      }));

    // Determine fallback state (non-gemini provider => mock)
    if (modelMeta?.provider && modelMeta.provider !== "gemini") {
      isFallback = true;
    }

    const countryMatchCount = recommendedUniversities.filter((u) => {
      const lc = (u.location || "").toLowerCase();
      return countryLike.some((c) => lc.includes(c.toLowerCase()));
    }).length;
    const dataSourceNote = `Filtered ${
      universities.length
    } universities after relaxations (${
      relaxationSteps.join(" > ") || "none"
    }) -> scored ${normalizedUniversities.length} -> returned ${
      recommendedUniversities.length
    }. Requested locations: ${
      requestedLocations.join(", ") || "none"
    }; country matches in top: ${countryMatchCount}. IngestionFailures: ${
      ingestionFailures.length
    }`;

    // Cache result
    aiService.cache.set(cacheKey, {
      aiCounsellorNote: aiNote,
      recommendedUniversities,
      modelMeta,
      isFallback,
      dataSourceNote,
      diagnostics: {
        relaxationSteps,
        requestedLocations,
        countryLike,
        countryMatchCount,
        ingestionFailures,
      },
      timestamp: Date.now(),
    });

    // Send response
    res.status(200).json({
      success: true,
      data: {
        aiCounsellorNote: aiNote,
        recommendedUniversities,
        modelMeta,
        isFallback,
        dataSourceNote,
        diagnostics: {
          relaxationSteps,
          requestedLocations,
          countryLike,
          countryMatchCount,
          ingestionFailures,
        },
        fromCache: false,
      },
    });
  } catch (error) {
    // If AI service fails, return fallback response
    if (error.message.includes("AI") || error.message.includes("timeout")) {
      logger.error(`AI service failed: ${error.message}`);

      try {
        // Get some universities as fallback
        const universities = await University.find({}).limit(5).lean();

        // Prepare fallback response
        const recommendedUniversities = universities.map((uni) => ({
          id: uni._id,
          name: uni.name,
          location: `${uni.location.city}, ${uni.location.state}`,
          matchScore: 75, // Default match score
          placementRate: uni.benchmarks?.placementPercentage,
          avgSalary: uni.benchmarks?.averageSalary,
          annualFee:
            uni.courses.reduce((sum, c) => sum + c.annualFee, 0) /
            uni.courses.length,
          ranking: uni.benchmarks?.ranking,
          tags: uni.keyFeatures.slice(0, 3),
          keyFeatures: uni.keyFeatures,
        }));

        // Fallback AI note
        const fallbackNote = `
Based on your profile and interests, here are some universities that could be a good fit for your higher education journey. Each offers unique opportunities in your chosen field. I recommend exploring their websites further to learn more about their programs, campus life, and admission requirements.
        `;

        return res.status(200).json({
          success: true,
          data: {
            aiCounsellorNote: fallbackNote,
            recommendedUniversities,
            isFallback: true,
          },
        });
      } catch (fallbackError) {
        logger.error(`Fallback also failed: ${fallbackError.message}`);
        next(error); // Use original error
      }
    } else {
      next(error);
    }
  }
};

// Preview recommendations without using AI
export const previewRecommendations = async (req, res, next) => {
  try {
    let { profile } = req.body;
    if (profile && (!profile.interests || !profile.preferences)) {
      profile = normalizeIncomingProfile(profile);
    }

    // Step 1: Filter universities based on hard constraints
    const { interests, preferences } = profile;

    // Build initial filter
    let filter = {};

    // Field of study filter
    if (interests?.fieldOfStudy) {
      filter["courses.field"] = interests.fieldOfStudy;
    }

    // Location filter
    if (preferences?.locations && preferences.locations.length > 0) {
      filter["$or"] = [
        { "location.state": { $in: preferences.locations } },
        { "location.city": { $in: preferences.locations } },
      ];
    }

    // Budget filter
    if (preferences?.budget) {
      filter["courses.annualFee"] = { $lte: preferences.budget };
    }

    // Query universities
    let universities = await University.find(filter).lean();

    // If not enough results, relax constraints
    if (universities.length < 3) {
      // Relax location constraint first
      delete filter["$or"];
      universities = await University.find(filter).lean();

      // If still not enough, relax budget constraint by 10%
      if (universities.length < 3 && preferences?.budget) {
        filter["courses.annualFee"] = { $lte: preferences.budget * 1.1 };
        universities = await University.find(filter).lean();
      }

      // If still not enough, relax field of study constraint
      if (universities.length < 3) {
        delete filter["courses.field"];
        universities = await University.find({}).limit(5).lean();
      }
    }

    // Step 2: Score and rank universities
    const normalizedUniversities = normalizeUniversityData(universities);
    const scoredUniversities = scoreUniversities(
      normalizedUniversities,
      preferences
    );

    // Limit to top 7 universities
    const topUniversities = scoredUniversities.slice(0, 7);

    // Prepare response data
    const recommendedUniversities = topUniversities.map((uni) => ({
      id: uni._id,
      name: uni.name,
      location: `${uni.location.city}, ${uni.location.state}`,
      matchScore: Math.round(uni._score * 100),
      placementRate: uni.benchmarks?.placementPercentage,
      avgSalary: uni.benchmarks?.averageSalary,
      annualFee:
        uni.courses.reduce((sum, c) => sum + c.annualFee, 0) /
        uni.courses.length,
      ranking: uni.benchmarks?.ranking,
      tags: uni.keyFeatures.slice(0, 3),
      keyFeatures: uni.keyFeatures,
      debugMeta: uni._debugMeta,
    }));

    // Send response
    res.status(200).json({
      success: true,
      data: {
        recommendedUniversities,
        appliedFilters: filter,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Helper to map flat profile (current frontend) to expected nested structure
function normalizeIncomingProfile(raw) {
  if (!raw) return raw;
  // If already nested, return
  if (raw.interests || raw.preferences) return raw;
  // Map frontend field codes to canonical backend fields
  const fieldMap = {
    "computer-science": "Engineering",
    engineering: "Engineering",
    business: "Commerce",
    commerce: "Commerce",
    medicine: "Medicine",
    arts: "Arts",
    sciences: "Science",
    science: "Science",
    law: "Law",
  };
  const mappedField =
    fieldMap[(raw.field || raw.fieldOfStudy || "").toLowerCase()] ||
    raw.field ||
    raw.fieldOfStudy ||
    null;
  // Handle location: skip location filter if country code / 'anywhere'
  const loc = raw.location;
  // Treat these tokens as countries (keep them so dynamic ingestion runs)
  const isCountryLike =
    loc &&
    /^(usa|united states|uk|united kingdom|canada|australia|germany|india)$/i.test(
      loc
    );
  const locations = loc ? [loc] : [];
  return {
    academics: raw.academics || {
      grade12Score: raw.academics?.grade12Score || raw.gpa || null,
      board: raw.academics?.board || null,
    },
    interests: {
      fieldOfStudy: mappedField,
      courses: raw.courses || [],
    },
    preferences: {
      locations,
      budget: raw.budget || null,
      priorities: raw.priorities || [],
    },
  };
}
