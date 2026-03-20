const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const { errorResponse } = require("./utils/apiResponse");

const app = express();

// ─── Security & Middleware ────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true, // Allow cookies
}));

app.use(express.json({ limit: "10kb" }));       // Body parser with size limit
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev")); // HTTP request logger
}

// Global rate limiter (very generous — specific endpoints have stricter limits)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: "Too many requests. Please slow down." },
});
app.use("/api", globalLimiter);

// ─── Routes ───────────────────────────────────────────────────────────────────────
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is healthy 🚀",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────────
app.use((req, res) => {
  return errorResponse(res, 404, `Route ${req.originalUrl} not found.`);
});

// ─── Global Error Handler ─────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return errorResponse(res, 400, "Validation failed.", errors);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return errorResponse(res, 409, `${field} already exists.`);
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") return errorResponse(res, 401, "Invalid token.");
  if (err.name === "TokenExpiredError") return errorResponse(res, 401, "Token expired.");

  return errorResponse(res, err.statusCode || 500, err.message || "Internal Server Error");
});

module.exports = app;
