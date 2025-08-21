import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { requestId } from "./middleware/requestId.middleware.js";
import mongoose from "mongoose";
import { logger } from "./utils/logger.js";
import authRoutes from "./routes/auth.routes.js";
import recommendRoutes from "./routes/recommend.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import universityRoutes from "./routes/university.routes.js";
import shortlistRoutes from "./routes/shortlist.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import enrichRoutes from "./routes/enrich.routes.js";
import University from "./models/university.model.js";
import { ingestCountryUniversities } from "./services/ingest.service.js";
import { mapField } from "./utils/fieldMap.js";
import { errorHandler } from "./middleware/error.middleware.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => logger.info("MongoDB connected"))
  .catch((err) => {
    logger.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  });

// Middleware
app.use(helmet());
app.use(requestId);

app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 600000, // 10 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX) || 60, // 60 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMITED",
      message: "Too many requests, please try again later",
    },
  },
});
app.use(limiter);

// Simple request logging (method, path, duration)
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info(
      {
        reqId: req.id,
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        duration,
      },
      "request_complete"
    );
  });
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/recommend", recommendRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/universities", universityRoutes);
app.use("/api/shortlist", shortlistRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/enrich", enrichRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: "UP",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
    },
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  // Background enrichment every 6 hours (non-blocking, best-effort)
  const intervalMs =
    (parseInt(process.env.ENRICH_INTERVAL_HOURS) || 6) * 60 * 60 * 1000;
  setInterval(async () => {
    try {
      const distinctCountries = await University.distinct("location.country");
      const targetCountries = distinctCountries.filter(Boolean).slice(0, 10); // cap
      const targetFields = [
        "Engineering",
        "Science",
        "Medicine",
        "Commerce",
        "Arts",
      ];
      for (const country of targetCountries) {
        for (const field of targetFields) {
          const count = await University.countDocuments({
            "location.country": country,
            "courses.field": field,
          });
          if (count < 5) {
            await ingestCountryUniversities(country, { field, force: true });
            logger.info({ country, field }, "background_enrichment");
          }
        }
      }
    } catch (e) {
      logger.warn({ err: e.message }, "background_enrichment_failed");
    }
  }, intervalMs).unref();
});

export default app;
