const { verifyToken } = require("../utils/generateTokens");
const User = require("../models/User");
const { getCache, setCache } = require("../config/redis");
const { errorResponse } = require("../utils/apiResponse");

// ─── Protect: Verify JWT ────────────────────────────────────────────────────────
const protect = async (req, res, next) => {
  try {
    let token;

    // Accept token from Authorization header OR cookie
    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return errorResponse(res, 401, "Access denied. No token provided.");
    }

    // Verify token
    const decoded = verifyToken(token, process.env.JWT_SECRET);
    if (!decoded) {
      return errorResponse(res, 401, "Invalid or expired token.");
    }

    // Check Redis cache before hitting MongoDB
    const cacheKey = `user:${decoded.id}`;
    let user = await getCache(cacheKey);

    if (!user) {
      // Cache miss → fetch from DB
      user = await User.findById(decoded.id).select("-password -refreshToken");
      if (!user) return errorResponse(res, 401, "User no longer exists.");

      // Store in Redis for 15 minutes
      await setCache(cacheKey, user.toObject(), 900);
    }

    if (!user.isActive) {
      return errorResponse(res, 403, "Account has been deactivated.");
    }

    req.user = user;
    next();
  } catch (error) {
    return errorResponse(res, 500, "Authentication error.", error.message);
  }
};

// ─── Email Verified Guard ───────────────────────────────────────────────────────
const requireEmailVerified = (req, res, next) => {
  if (!req.user.isEmailVerified) {
    return errorResponse(res, 403, "Please verify your email address to access this resource.");
  }
  next();
};

module.exports = { protect, requireEmailVerified };
