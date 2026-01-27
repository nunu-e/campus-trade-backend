const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  registerUser,
  loginUser,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  getUserProfile,
  updateUserProfile,
} = require("../controllers/authController");

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/verify/:code", verifyEmail);
router.post("/resend-verification", resendVerification);
router.post("/forgot-password", forgotPassword);
router.post("/reset/:token", resetPassword);

// Protected routes
router
  .route("/profile")
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

module.exports = router;
