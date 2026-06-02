const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { registerValidator, loginValidator } = require("../utils/validators");
const { validate } = require("../middleware/validationMiddleware");
const { authLimiter, sensitiveLimiter } = require("../middleware/rateLimiter");
const {
  registerUser,
  loginUser,
  verifyEmail, // old, keep for now
  resendVerification, // old, can be deprecated
  forgotPassword,
  resetPassword,
  getUserProfile,
  updateUserProfile,
  sendOTP, // new
  verifyOTP, // new
} = require("../controllers/authController");

// Public routes
router.post(
  "/register",
  authLimiter,
  registerValidator,
  validate,
  registerUser,
);
router.post("/login", authLimiter, loginValidator, validate, loginUser);
router.post("/send-otp", sensitiveLimiter, sendOTP);
router.post("/verify-otp", sensitiveLimiter, verifyOTP);
router.post("/forgot-password", sensitiveLimiter, forgotPassword);
router.post("/reset/:token", resetPassword);

// Legacy email verification (keep for existing users)
router.get("/verify/:code", verifyEmail);
router.post("/resend-verification", sensitiveLimiter, resendVerification);

// Protected routes
router
  .route("/profile")
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

module.exports = router;
