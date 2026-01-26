const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getUserById,
  getUserListings,
  getUserTransactions,
  getUserReviews,
  searchUsers,
} = require("../controllers/userController");

// Apply protect middleware to all user routes
router.use(protect);

// GET /api/users/:id - Get user by ID
router.get("/:id", getUserById);

// GET /api/users/:id/listings - Get user's listings
router.get("/:id/listings", getUserListings);

// GET /api/users/:id/transactions - Get user's transactions
router.get("/:id/transactions", getUserTransactions);

// GET /api/users/:id/reviews - Get user's reviews
router.get("/:id/reviews", getUserReviews);

// GET /api/users/search - Search users
router.get("/search", searchUsers);

module.exports = router;
