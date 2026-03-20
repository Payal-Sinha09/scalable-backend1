const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateProfile,
  changePassword,
  updateUserRole,
  deactivateUser,
} = require("../controllers/userController");
const { protect, requireEmailVerified } = require("../middleware/authMiddleware");
const { restrictTo } = require("../middleware/roleMiddleware");

// All routes below require authentication
router.use(protect);
router.use(requireEmailVerified);

// ─── User Routes ────────────────────────────────────────────────────────────────
router.get("/profile", (req, res) => {
  const { successResponse } = require("../utils/apiResponse");
  return successResponse(res, 200, "Profile fetched.", { user: req.user });
});
router.put("/profile", updateProfile);
router.put("/change-password", changePassword);

// ─── Admin Routes ────────────────────────────────────────────────────────────────
router.get("/", restrictTo("admin"), getAllUsers);
router.get("/:id", restrictTo("admin", "moderator"), getUserById);
router.put("/:id/role", restrictTo("admin"), updateUserRole);
router.put("/:id/deactivate", restrictTo("admin"), deactivateUser);

module.exports = router;
