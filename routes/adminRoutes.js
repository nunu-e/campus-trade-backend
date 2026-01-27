const express = require("express");
const router = express.Router();
const { protect, admin } = require("../middleware/authMiddleware");
const {
  getAllUsers,
  updateUserStatus,
  getAllListings,
  updateListingStatus,
  getAllTransactions,
  getDashboardStats,
  getReports,
} = require("../controllers/adminController");

// All routes require admin access
router.use(protect, admin);

// User management
router.get("/users", getAllUsers);
router.put("/users/:id/status", updateUserStatus);

// Listing management
router.get("/listings", getAllListings);
router.put("/listings/:id/status", updateListingStatus);

// Transaction management
router.get("/transactions", getAllTransactions);

// Dashboard
router.get("/stats", getDashboardStats);

// Report management
router.get("/reports", getReports);

module.exports = router;
