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

const setTokenCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
};

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return errorResponse(res, 409, "An account with this email already exists.");
    const { token: verificationToken, expires: verificationExpires } = generateEmailVerificationToken();
    const user = await User.create({
      name, email, password,
      isEmailVerified: true,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    });
    try { await sendVerificationEmail(user, verificationToken); } catch (e) { console.error("Email failed:", e.message); }
    return successResponse(res, 201, "Registration successful! You can now log in.", { user: user.toPublicProfile() });
  } catch (error) {
    console.error("Register error:", error);
    return errorResponse(res, 500, "Registration failed.", error.message);
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return errorResponse(res, 400, "Verification token is required.");
    const user = await User.findOne({ emailVerificationToken: token, emailVerificationExpires: { $gt: Date.now() } }).select("+emailVerificationToken +emailVerificationExpires");
    if (!user) return errorResponse(res, 400, "Invalid or expired verification token.");
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();
    try { await sendWelcomeEmail(user); } catch {}
    return successResponse(res, 200, "Email verified successfully!");
  } catch (error) {
    return errorResponse(res, 500, "Email verification failed.", error.message);
  }
};

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
    return successResponse(res, 200, "Verification email resent.");
  } catch (error) {
    return errorResponse(res, 500, "Failed to resend verification email.", error.message);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password +refreshToken");
    if (!user) return errorResponse(res, 401, "Invalid email or password.");
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return errorResponse(res, 401, "Invalid email or password.");
    if (!user.isActive) return errorResponse(res, 403, "Your account has been deactivated.");
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);
    const salt = await bcrypt.genSalt(10);
    user.refreshToken = await bcrypt.hash(refreshToken, salt);
    user.lastLogin = new Date();
    await user.save();
    setTokenCookies(res, accessToken, refreshToken);
    await deleteCache(`user:${user._id}`);
    return successResponse(res, 200, "Login successful!", { user: user.toPublicProfile(), accessToken });
  } catch (error) {
    return errorResponse(res, 500, "Login failed.", error.message);
  }
};

const logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { refreshToken: null });
    await deleteCache(`user:${req.user.id}`);
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    return successResponse(res, 200, "Logged out successfully.");
  } catch (error) {
    return errorResponse(res, 500, "Logout failed.", error.message);
  }
};

const refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!token) return errorResponse(res, 401, "Refresh token not provided.");
    const decoded = verifyToken(token, process.env.JWT_REFRESH_SECRET);
    if (!decoded) return errorResponse(res, 401, "Invalid or expired refresh token.");
    const user = await User.findById(decoded.id).select("+refreshToken");
    if (!user || !user.refreshToken) return errorResponse(res, 401, "Refresh token revoked.");
    const isValid = await bcrypt.compare(token, user.refreshToken);
    if (!isValid) return errorResponse(res, 401, "Refresh token mismatch.");
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

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return successResponse(res, 200, "If an account exists, a reset link has been sent.");
    const { token, expires } = generatePasswordResetToken();
    user.passwordResetToken = token;
    user.passwordResetExpires = expires;
    await user.save();
    try {
      await sendPasswordResetEmail(user, token);
    } catch (emailErr) {
      console.error("Reset email failed:", emailErr.message);
      return errorResponse(res, 500, "Failed to send reset email. Please try again later.");
    }
    return successResponse(res, 200, "Password reset email sent.");
  } catch (error) {
    return errorResponse(res, 500, "Failed to send reset email.", error.message);
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.query;
    const { password } = req.body;
    if (!token) return errorResponse(res, 400, "Reset token is required.");
    const user = await User.findOne({ passwordResetToken: token, passwordResetExpires: { $gt: Date.now() } }).select("+passwordResetToken +passwordResetExpires");
    if (!user) return errorResponse(res, 400, "Invalid or expired reset token.");
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshToken = undefined;
    await user.save();
    await deleteCache(`user:${user._id}`);
    return successResponse(res, 200, "Password reset successful. Please log in.");
  } catch (error) {
    return errorResponse(res, 500, "Password reset failed.", error.message);
  }
};

const getMe = async (req, res) => {
  return successResponse(res, 200, "User fetched.", { user: req.user });
};

module.exports = { register, verifyEmail, resendVerificationEmail, login, logout, refreshToken, forgotPassword, resetPassword, getMe };