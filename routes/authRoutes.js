const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  verifyEmail,
  getUserProfile,
  updateUserProfile,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

// Debug middleware
router.use((req, res, next) => {
  console.log(`Auth route accessed: ${req.method} ${req.url}`);
  next();
});

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/verify/:code", verifyEmail);

// Protected routes
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);

// Test route
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Auth routes are working!",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
