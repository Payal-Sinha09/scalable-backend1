const express = require("express");
const router = express.Router();
const {
  register, login, logout, refreshToken, getMe,
  getSecurityQuestion, verifySecurityAnswer, resetPassword,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many attempts. Please try again in 15 minutes." },
});

// Public routes
router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/refresh-token", refreshToken);

// Password reset via security question (no email needed)
router.post("/get-security-question", getSecurityQuestion);
router.post("/verify-security-answer", authLimiter, verifySecurityAnswer);
router.post("/reset-password", authLimiter, resetPassword);

// Protected routes
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);

module.exports = router;