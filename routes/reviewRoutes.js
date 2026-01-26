const express = require("express");
const router = express.Router();
const { protect, verified } = require("../middleware/authMiddleware");
const {
  createReview,
  getReviewsForUser,
  getReviewsForListing,
  updateReview,
  deleteReview,
} = require("../controllers/reviewController");

router.route("/").post(protect, verified, createReview);

router.get("/user/:userId", getReviewsForUser);
router.get("/listing/:listingId", getReviewsForListing);

router
  .route("/:id")
  .put(protect, verified, updateReview)
  .delete(protect, verified, deleteReview);

module.exports = router;
