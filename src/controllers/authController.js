const User = require("../models/User");
const {
  generateAccessToken,
  generateRefreshToken,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  verifyToken,
} = require("../utils/generateTokens");
const { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } = require("../utils/email");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const { deleteCache } = require("../config/redis");
const bcrypt = require("bcryptjs");

// Helper: Set tokens as cookies
const setTokenCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
};

// ─── REGISTER ───────────────────────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, 409, "An account with this email already exists.");
    }

    // Generate email verification token
    const { token: verificationToken, expires: verificationExpires } = generateEmailVerificationToken();

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    });

    // Send verification email
    await sendVerificationEmail(user, verificationToken);

    return successResponse(res, 201, "Registration successful! Please check your email to verify your account.", {
      user: user.toPublicProfile(),
    });
  } catch (error) {
    console.error("Register error:", error);
    return errorResponse(res, 500, "Registration failed.", error.message);
  }
};

// ─── VERIFY EMAIL ────────────────────────────────────────────────────────────────
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) return errorResponse(res, 400, "Verification token is required.");

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }, // Token not expired
    }).select("+emailVerificationToken +emailVerificationExpires");

    if (!user) {
      return errorResponse(res, 400, "Invalid or expired verification token.");
    }

    // Mark as verified and clear token
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // Send welcome email
    await sendWelcomeEmail(user);

    return successResponse(res, 200, "Email verified successfully! You can now log in.");
  } catch (error) {
    return errorResponse(res, 500, "Email verification failed.", error.message);
  }
};

// ─── RESEND VERIFICATION EMAIL ───────────────────────────────────────────────────
const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email }).select("+emailVerificationToken +emailVerificationExpires");

    if (!user) return errorResponse(res, 404, "No account found with this email.");
    if (user.isEmailVerified) return errorResponse(res, 400, "Email is already verified.");

    const { token, expires } = generateEmailVerificationToken();
    user.emailVerificationToken = token;
    user.emailVerificationExpires = expires;
    await user.save();

    await sendVerificationEmail(user, token);

    return successResponse(res, 200, "Verification email resent. Please check your inbox.");
  } catch (error) {
    return errorResponse(res, 500, "Failed to resend verification email.", error.message);
  }
};

// ─── LOGIN ───────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Fetch user with password
    const user = await User.findOne({ email }).select("+password +refreshToken");
    if (!user) return errorResponse(res, 401, "Invalid email or password.");

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return errorResponse(res, 401, "Invalid email or password.");

    if (!user.isActive) return errorResponse(res, 403, "Your account has been deactivated.");

    // Check email verification
    if (!user.isEmailVerified) {
      return errorResponse(res, 403, "Please verify your email before logging in.");
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Store hashed refresh token in DB
    const salt = await bcrypt.genSalt(10);
    user.refreshToken = await bcrypt.hash(refreshToken, salt);
    user.lastLogin = new Date();
    await user.save();

    // Set cookies
    setTokenCookies(res, accessToken, refreshToken);

    // Clear stale cache
    await deleteCache(`user:${user._id}`);

    return successResponse(res, 200, "Login successful!", {
      user: user.toPublicProfile(),
      accessToken, // Also return in body for non-cookie clients
    });
  } catch (error) {
    return errorResponse(res, 500, "Login failed.", error.message);
  }
};

// ─── LOGOUT ──────────────────────────────────────────────────────────────────────
const logout = async (req, res) => {
  try {
    // Clear refresh token from DB
    await User.findByIdAndUpdate(req.user.id, { refreshToken: null });

    // Clear Redis cache
    await deleteCache(`user:${req.user.id}`);

    // Clear cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return successResponse(res, 200, "Logged out successfully.");
  } catch (error) {
    return errorResponse(res, 500, "Logout failed.", error.message);
  }
};

// ─── REFRESH TOKEN ────────────────────────────────────────────────────────────────
const refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!token) return errorResponse(res, 401, "Refresh token not provided.");

    const decoded = verifyToken(token, process.env.JWT_REFRESH_SECRET);
    if (!decoded) return errorResponse(res, 401, "Invalid or expired refresh token.");

    const user = await User.findById(decoded.id).select("+refreshToken");
    if (!user || !user.refreshToken) return errorResponse(res, 401, "Refresh token revoked.");

    // Verify stored token matches
    const isValid = await bcrypt.compare(token, user.refreshToken);
    if (!isValid) return errorResponse(res, 401, "Refresh token mismatch.");

    // Issue new tokens
    const newAccessToken = generateAccessToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id);

    const salt = await bcrypt.genSalt(10);
    user.refreshToken = await bcrypt.hash(newRefreshToken, salt);
    await user.save();

    setTokenCookies(res, newAccessToken, newRefreshToken);

    return successResponse(res, 200, "Token refreshed.", { accessToken: newAccessToken });
  } catch (error) {
    return errorResponse(res, 500, "Token refresh failed.", error.message);
  }
};

// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────────
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Always return success to prevent email enumeration
    if (!user) return successResponse(res, 200, "If an account exists, a reset link has been sent.");

    const { token, expires } = generatePasswordResetToken();
    user.passwordResetToken = token;
    user.passwordResetExpires = expires;
    await user.save();

    await sendPasswordResetEmail(user, token);

    return successResponse(res, 200, "Password reset email sent. Please check your inbox.");
  } catch (error) {
    return errorResponse(res, 500, "Failed to send reset email.", error.message);
  }
};

// ─── RESET PASSWORD ────────────────────────────────────────────────────────────────
const resetPassword = async (req, res) => {
  try {
    const { token } = req.query;
    const { password } = req.body;

    if (!token) return errorResponse(res, 400, "Reset token is required.");

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() },
    }).select("+passwordResetToken +passwordResetExpires");

    if (!user) return errorResponse(res, 400, "Invalid or expired reset token.");

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshToken = undefined; // Invalidate all sessions
    await user.save();

    // Clear user cache
    await deleteCache(`user:${user._id}`);

    return successResponse(res, 200, "Password reset successful. Please log in with your new password.");
  } catch (error) {
    return errorResponse(res, 500, "Password reset failed.", error.message);
  }
};

// ─── GET CURRENT USER ──────────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  return successResponse(res, 200, "User fetched.", { user: req.user });
};

module.exports = {
  register,
  verifyEmail,
  resendVerificationEmail,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  getMe,
};
