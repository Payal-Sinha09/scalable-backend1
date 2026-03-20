const User = require("../models/User");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const { getCache, setCache, deleteCache } = require("../config/redis");

// ─── GET ALL USERS (Admin only) ─────────────────────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Cache key includes pagination
    const cacheKey = `users:page:${page}:limit:${limit}`;
    const cached = await getCache(cacheKey);

    if (cached) {
      return successResponse(res, 200, "Users fetched (cached).", cached);
    }

    const [users, total] = await Promise.all([
      User.find({ isActive: true })
        .select("-password -refreshToken -emailVerificationToken -passwordResetToken")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments({ isActive: true }),
    ]);

    const result = {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };

    // Cache for 5 minutes
    await setCache(cacheKey, result, 300);

    return successResponse(res, 200, "Users fetched.", result);
  } catch (error) {
    return errorResponse(res, 500, "Failed to fetch users.", error.message);
  }
};

// ─── GET SINGLE USER ────────────────────────────────────────────────────────────
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `user:${id}`;

    const cached = await getCache(cacheKey);
    if (cached) return successResponse(res, 200, "User fetched (cached).", { user: cached });

    const user = await User.findById(id).select("-password -refreshToken");
    if (!user) return errorResponse(res, 404, "User not found.");

    await setCache(cacheKey, user.toObject(), 900);

    return successResponse(res, 200, "User fetched.", { user });
  } catch (error) {
    return errorResponse(res, 500, "Failed to fetch user.", error.message);
  }
};

// ─── UPDATE PROFILE (own) ────────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;

    // Only allow updating name here (not role/password — use separate endpoints)
    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { name },
      { new: true, runValidators: true }
    ).select("-password -refreshToken");

    // Invalidate cache
    await deleteCache(`user:${req.user.id}`);

    return successResponse(res, 200, "Profile updated.", { user: updated });
  } catch (error) {
    return errorResponse(res, 500, "Profile update failed.", error.message);
  }
};

// ─── CHANGE PASSWORD ─────────────────────────────────────────────────────────────
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select("+password");
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return errorResponse(res, 400, "Current password is incorrect.");

    user.password = newPassword;
    user.refreshToken = undefined; // Force re-login on all devices
    await user.save();

    await deleteCache(`user:${user._id}`);

    return successResponse(res, 200, "Password changed. Please log in again.");
  } catch (error) {
    return errorResponse(res, 500, "Password change failed.", error.message);
  }
};

// ─── UPDATE USER ROLE (Admin only) ──────────────────────────────────────────────
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ["user", "moderator", "admin"];
    if (!validRoles.includes(role)) {
      return errorResponse(res, 400, `Invalid role. Must be one of: ${validRoles.join(", ")}`);
    }

    const user = await User.findByIdAndUpdate(id, { role }, { new: true });
    if (!user) return errorResponse(res, 404, "User not found.");

    // Invalidate cache so new role takes effect immediately
    await deleteCache(`user:${id}`);

    return successResponse(res, 200, `User role updated to ${role}.`, { user: user.toPublicProfile() });
  } catch (error) {
    return errorResponse(res, 500, "Role update failed.", error.message);
  }
};

// ─── DEACTIVATE USER (Admin only) ────────────────────────────────────────────────
const deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!user) return errorResponse(res, 404, "User not found.");

    await deleteCache(`user:${id}`);

    return successResponse(res, 200, "User deactivated.");
  } catch (error) {
    return errorResponse(res, 500, "Deactivation failed.", error.message);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateProfile,
  changePassword,
  updateUserRole,
  deactivateUser,
};
