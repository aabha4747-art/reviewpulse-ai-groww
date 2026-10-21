
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { parse } = require("csv-parse/sync");

const { analyzeReviews } = require("./analyzeReviews");
const { generatePulse } = require("./generatePulse");
const { generateFeeExplainer } = require("./generateFeeExplainer");
const googleApprovalRouter = require("./googleApproval");

const app = express();

// =====================================
// MIDDLEWARE
// =====================================

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173"
  })
);

app.use(express.json({ limit: "3mb" }));

app.use("/api/google", googleApprovalRouter);
// =====================================
// 1. HEALTH CHECK API
// =====================================

app.get("/api/health", (req, res) => {
  return res.json({
    success: true,
    message: "ReviewPulse AI backend is running!",
    product: "Groww",
    status: "healthy",
    ai_provider: "Google Gemini", version: "csv-fix-v3"
  });
});

// =====================================
// CSV UPLOAD CONFIGURATION
// =====================================

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 2 * 1024 * 1024
  },

  fileFilter: (req, file, cb) => {
    if (!file.originalname.toLowerCase().endsWith(".csv")) {
      return cb(new Error("Only CSV files are allowed."));
    }

    cb(null, true);
  }
});

// =====================================
// 2. UPLOAD CUSTOMER REVIEWS
// =====================================

app.post("/api/reviews/upload", (req, res) => {
  upload.single("file")(req, res, (uploadError) => {
    if (uploadError) {
      return res.status(400).json({
        success: false,
        message: uploadError.message
      });
    }

    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Please select a CSV file."
        });
      }

      const csvText = req.file.buffer.toString("utf8");

      const records = parse(csvText, {
        columns: true,
        skip_empty_lines: true,
        bom: true,
        trim: true
      });

      const requiredColumns = [
        "review_id",
        "date",
        "rating",
        "review_text",
        "source",
        "source_url"
      ];

      if (
        records.length === 0 ||
        requiredColumns.some(
          (column) => !(column in records[0])
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "CSV is empty or missing required columns."
        });
      }

      const reviews = records.map((review, index) => {
        const ratingText = String(review.rating ?? "").trim();
        const rating = ratingText === "" ? null : Number(ratingText);

        if (
          !review.review_id ||
          !review.review_text ||
          !review.source ||
          !review.source_url ||
          !/^\d{4}-\d{2}-\d{2}$/.test(review.date) ||
          !Number.isFinite(Date.parse(review.date)) ||
          !Number.isInteger(rating) ||
          rating < 1 ||
          rating > 5
        ) {
          throw new Error(
            `Invalid review at CSV row ${index + 2}`
          );
        }

        return {
          ...review,
          rating
        };
      });

      const uniqueIds = new Set(
        reviews.map((review) => review.review_id)
      );

      if (uniqueIds.size !== reviews.length) {
        return res.status(400).json({
          success: false,
          message: "Duplicate review IDs found in CSV."
        });
      }

      const totalReviews = reviews.length;

      const averageRating =
        reviews.reduce(
          (sum, review) => sum + review.rating,
          0
        ) / totalReviews;

      return res.json({
        success: true,
        totalReviews,
        averageRating: Number(averageRating.toFixed(2)),
        reviews
      });

    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  });
});

// =====================================
// 3. GEMINI AI REVIEW ANALYSIS
// =====================================

app.post("/api/reviews/analyze", async (req, res) => {
  try {
    const reviews = req.body.reviews;

    if (
      !Array.isArray(reviews) ||
      reviews.length < 3
    ) {
      return res.status(400).json({
        success: false,
        message: "At least 3 reviews are required."
      });
    }

    if (reviews.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Maximum 500 reviews per analysis."
      });
    }

    const reviewIds = new Set();

    for (const review of reviews) {
      if (
        typeof review.review_id !== "string" ||
        typeof review.review_text !== "string" ||
        !review.review_id.trim() ||
        !review.review_text.trim() ||
        review.review_text.length > 5000 ||
        !Number.isInteger(review.rating) ||
        review.rating < 1 ||
        review.rating > 5 ||
        reviewIds.has(review.review_id)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid or duplicate review data."
        });
      }

      reviewIds.add(review.review_id);
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "Gemini API key is not configured."
      });
    }

    console.log(
      `Analyzing ${reviews.length} reviews with Gemini...`
    );

    const analysis = await analyzeReviews(reviews);

    console.log("AI analysis completed successfully.");

    return res.json({
      success: true,
      ai_provider: "Google Gemini", version: "csv-fix-v3",
      dataset_type: reviews.every(
        (review) => review.source === "Synthetic test"
      )
        ? "synthetic_test"
        : "unverified",
      total_reviews: reviews.length,
      analysis
    });

  } catch (error) {
    console.error("Gemini Analysis Error:", error);

    const errorMessage = String(error.message || "");
    const errorStatus = Number(error.status);

    let message =
      "AI analysis failed. Check the backend terminal.";

    let status = 500;

    if (
      errorStatus === 429 ||
      /quota|rate limit/i.test(errorMessage)
    ) {
      status = 429;
      message =
        "Gemini quota exceeded. Check your usage limits.";

    } else if (
      errorStatus === 401 ||
      errorStatus === 403 ||
      /API_KEY_INVALID/i.test(errorMessage)
    ) {
      status = 401;
      message =
        "Invalid Gemini API key or access denied.";

    } else if (
      errorStatus === 404 ||
      /not found|not supported/i.test(errorMessage)
    ) {
      status = 400;
      message =
        "Gemini model unavailable. Check GEMINI_MODEL.";

    } else if (
      [502, 503, 504].includes(errorStatus)
    ) {
      status = 503;
      message =
        "Gemini is temporarily unavailable. Please try again later.";
    }

    return res.status(status).json({
      success: false,
      message
    });
  }
});

// =====================================
// 4. WEEKLY PRODUCT PULSE
// =====================================

app.post("/api/reviews/pulse", async (req, res) => {
  try {
    const { reviews, analysis } = req.body;

    if (
      !Array.isArray(reviews) ||
      reviews.length < 3 ||
      reviews.length > 500 ||
      !analysis ||
      !Array.isArray(analysis.themes) ||
      !Array.isArray(analysis.quotes) ||
      analysis.quotes.length !== 3
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid reviews and AI analysis are required."
      });
    }

    const reviewMap = new Map(
      reviews.map((review) => [
        review.review_id,
        review.review_text
      ])
    );

    for (const item of analysis.quotes) {
      if (
        reviewMap.get(item.review_id) !== item.quote
      ) {
        return res.status(400).json({
          success: false,
          message: "Quote verification failed."
        });
      }
    }

    const pulse = await generatePulse(
      reviews,
      analysis
    );

    return res.json({
      success: true,
      pulse
    });

  } catch (error) {
    console.error(
      "Pulse generation error:",
      error
    );

    const errorStatus = Number(error.status);

    return res.status(
      [502, 503, 504].includes(errorStatus)
        ? 503
        : 500
    ).json({
      success: false,
      message:
        [502, 503, 504].includes(errorStatus)
          ? "Gemini is temporarily unavailable. Please try again later."
          : "Pulse generation failed. Check backend terminal."
    });
  }
});

// =====================================
// 5. GROWw FEE EXPLAINER
// =====================================

app.post("/api/reviews/fee-explainer", (req, res) => {
  try {
    const { analysis } = req.body || {};

    if (
      !analysis ||
      !analysis.fee_issue ||
      !Array.isArray(
        analysis.fee_issue.review_ids
      ) ||
      typeof analysis.fee_issue.recurring !== "boolean"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid AI review analysis is required."
      });
    }

    const feeExplainer =
      generateFeeExplainer(analysis);

    return res.json({
      success: true,
      feeExplainer
    });

  } catch (error) {
    console.error(
      "Fee Explainer Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to generate Fee Explainer."
    });
  }
});

// =====================================
// START SERVER
// =====================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("--------------------------------");
  console.log("ReviewPulse AI Backend Started");
  console.log(`Server: http://localhost:${PORT}`);
  console.log("AI Provider: Google Gemini");
  console.log("--------------------------------");
});

