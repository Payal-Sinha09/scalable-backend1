const { errorResponse } = require("../utils/apiResponse");

// Role hierarchy: admin > moderator > user
const ROLE_HIERARCHY = { user: 1, moderator: 2, admin: 3 };

// ─── Restrict to specific roles ─────────────────────────────────────────────────
// Usage: restrictTo("admin") or restrictTo("admin", "moderator")
const restrictTo = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 401, "Authentication required.");
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(
        res,
        403,
        `Access denied. Required role: ${allowedRoles.join(" or ")}. Your role: ${req.user.role}`
      );
    }

    next();
  };
};

// ─── Minimum role level ──────────────────────────────────────────────────────────
// Usage: requireMinRole("moderator") — allows moderator and admin
const requireMinRole = (minRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 401, "Authentication required.");
    }

    const userLevel = ROLE_HIERARCHY[req.user.role] || 0;
    const requiredLevel = ROLE_HIERARCHY[minRole] || 0;

    if (userLevel < requiredLevel) {
      return errorResponse(
        res,
        403,
        `Access denied. Minimum required role: ${minRole}.`
      );
    }

    next();
  };
};

module.exports = { restrictTo, requireMinRole };
