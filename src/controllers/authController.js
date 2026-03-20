const User = require("../models/User");
const {
  generateAccessToken,
  generateRefreshToken,
  generatePasswordResetToken,
  verifyToken,
} = require("../utils/generateTokens");
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

// ─── REGISTER ────────────────────────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { name, email, password, securityQuestion, securityAnswer } = req.body;

    if (!securityQuestion || !securityAnswer) {
      return errorResponse(res, 400, "Security question and answer are required.");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return errorResponse(res, 409, "An account with this email already exists.");

    const user = await User.create({
      name, email, password,
      securityQuestion, securityAnswer,
      isEmailVerified: true,
    });

    return successResponse(res, 201, "Registration successful! You can now log in.", {
      user: user.toPublicProfile(),
    });
  } catch (error) {
    console.error("Register error:", error);
    return errorResponse(res, 500, "Registration failed.", error.message);
  }
};

// ─── GET SECURITY QUESTION ────────────────────────────────────────────────────────
const getSecurityQuestion = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return errorResponse(res, 404, "No account found with this email.");
    return successResponse(res, 200, "Security question fetched.", {
      securityQuestion: user.securityQuestion,
    });
  } catch (error) {
    return errorResponse(res, 500, "Failed to fetch security question.", error.message);
  }
};

// ─── VERIFY SECURITY ANSWER & GET RESET TOKEN ─────────────────────────────────────
const verifySecurityAnswer = async (req, res) => {
  try {
    const { email, securityAnswer } = req.body;
    const user = await User.findOne({ email }).select("+securityAnswer");
    if (!user) return errorResponse(res, 404, "No account found with this email.");

    const isMatch = await user.compareSecurityAnswer(securityAnswer);
    if (!isMatch) return errorResponse(res, 400, "Incorrect security answer.");

    // Generate a short-lived reset token
    const { token, expires } = generatePasswordResetToken();
    user.passwordResetToken = token;
    user.passwordResetExpires = expires;
    await user.save();

    return successResponse(res, 200, "Answer verified! You can now reset your password.", {
      resetToken: token,
    });
  } catch (error) {
    return errorResponse(res, 500, "Verification failed.", error.message);
  }
};

// ─── RESET PASSWORD ────────────────────────────────────────────────────────────────
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token) return errorResponse(res, 400, "Reset token is required.");

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() },
    }).select("+passwordResetToken +passwordResetExpires");

    if (!user) return errorResponse(res, 400, "Invalid or expired reset token.");

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshToken = undefined;
    await user.save();

    await deleteCache(`user:${user._id}`);
    return successResponse(res, 200, "Password reset successful! Please log in.");
  } catch (error) {
    return errorResponse(res, 500, "Password reset failed.", error.message);
  }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────────
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

// ─── LOGOUT ───────────────────────────────────────────────────────────────────────
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

// ─── REFRESH TOKEN ────────────────────────────────────────────────────────────────
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

// ─── GET ME ───────────────────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  return successResponse(res, 200, "User fetched.", { user: req.user });
};

module.exports = {
  register, login, logout, refreshToken, getMe,
  getSecurityQuestion, verifySecurityAnswer, resetPassword,
};


