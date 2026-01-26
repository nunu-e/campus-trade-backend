const Review = require("../models/Review");
const User = require("../models/User");
const Transaction = require("../models/Transaction");

// @desc    Create a review
// @route   POST /api/reviews
// @access  Private/Verified
const createReview = async (req, res) => {
  try {
    const { transactionId, rating, comment, type } = req.body;

    // Validate transaction exists and is completed
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    if (transaction.status !== "Completed") {
      return res
        .status(400)
        .json({ message: "Can only review completed transactions" });
    }

    // Determine reviewed user based on type
    let reviewedUserId;
    if (type === "BuyerToSeller") {
      reviewedUserId = transaction.sellerId;
      if (transaction.buyerId.toString() !== req.user._id.toString()) {
        return res
          .status(403)
          .json({ message: "Not authorized to review as buyer" });
      }
    } else if (type === "SellerToBuyer") {
      reviewedUserId = transaction.buyerId;
      if (transaction.sellerId.toString() !== req.user._id.toString()) {
        return res
          .status(403)
          .json({ message: "Not authorized to review as seller" });
      }
    } else {
      return res.status(400).json({ message: "Invalid review type" });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({
      reviewerId: req.user._id,
      transactionId,
    });

    if (existingReview) {
      return res
        .status(400)
        .json({ message: "You have already reviewed this transaction" });
    }

    // Create review
    const review = await Review.create({
      reviewerId: req.user._id,
      reviewedUserId,
      transactionId,
      listingId: transaction.listingId,
      rating,
      comment,
      type,
    });

    // Update user's average rating
    await updateUserRating(reviewedUserId);

    res.status(201).json(review);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get reviews for a user
// @route   GET /api/reviews/user/:userId
// @access  Public
const getReviewsForUser = async (req, res) => {
  try {
    const reviews = await Review.find({ reviewedUserId: req.params.userId })
      .populate("reviewerId", "name")
      .populate("listingId", "title")
      .sort("-createdAt");

    res.json(reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get reviews for a listing
// @route   GET /api/reviews/listing/:listingId
// @access  Public
const getReviewsForListing = async (req, res) => {
  try {
    const reviews = await Review.find({ listingId: req.params.listingId })
      .populate("reviewerId", "name")
      .populate("reviewedUserId", "name")
      .sort("-createdAt");

    res.json(reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update a review
// @route   PUT /api/reviews/:id
// @access  Private/Verified
const updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Check ownership
    if (review.reviewerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Cannot update after 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (review.createdAt < sevenDaysAgo) {
      return res
        .status(400)
        .json({ message: "Cannot update review after 7 days" });
    }

    review.rating = req.body.rating || review.rating;
    review.comment = req.body.comment || review.comment;
    await review.save();

    // Update user's average rating
    await updateUserRating(review.reviewedUserId);

    res.json(review);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private/Verified
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Check ownership or admin
    if (
      review.reviewerId.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const reviewedUserId = review.reviewedUserId;
    await review.remove();

    // Update user's average rating
    await updateUserRating(reviewedUserId);

    res.json({ message: "Review deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Helper function to update user's average rating
const updateUserRating = async (userId) => {
  try {
    const reviews = await Review.find({ reviewedUserId: userId });

    if (reviews.length === 0) {
      await User.findByIdAndUpdate(userId, {
        rating: 0,
        totalReviews: 0,
      });
      return;
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    await User.findByIdAndUpdate(userId, {
      rating: parseFloat(averageRating.toFixed(1)),
      totalReviews: reviews.length,
    });
  } catch (error) {
    console.error("Error updating user rating:", error);
  }
};

module.exports = {
  createReview,
  getReviewsForUser,
  getReviewsForListing,
  updateReview,
  deleteReview,
};
