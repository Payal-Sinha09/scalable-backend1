const express = require("express");
const router = express.Router();
const {
  register,
  verifyEmail,
  resendVerificationEmail,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  getMe,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const rateLimit = require("express-rate-limit");

// Strict rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, message: "Too many attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Public Routes ───────────────────────────────────────────────────────────────
router.post("/register", authLimiter, register);
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", authLimiter, resendVerificationEmail);
router.post("/login", authLimiter, login);
router.post("/refresh-token", refreshToken);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);

// ─── Protected Routes ────────────────────────────────────────────────────────────
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);

module.exports = router;
