const User = require("../models/User");
const Listing = require("../models/Listing");
const Transaction = require("../models/Transaction");
const Review = require("../models/Review");

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "-password -verificationCode",
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Only show limited info for non-admin users
    if (
      req.user.role !== "admin" &&
      req.user._id.toString() !== user._id.toString()
    ) {
      res.json({
        _id: user._id,
        name: user.name,
        department: user.department,
        rating: user.rating,
        totalReviews: user.totalReviews,
        createdAt: user.createdAt,
      });
    } else {
      res.json(user);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get user's listings
// @route   GET /api/users/:id/listings
// @access  Private
const getUserListings = async (req, res) => {
  try {
    const listings = await Listing.find({ sellerId: req.params.id }).sort(
      "-createdAt",
    );

    res.json(listings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get user's transactions
// @route   GET /api/users/:id/transactions
// @access  Private
const getUserTransactions = async (req, res) => {
  try {
    // Only allow if user is viewing their own transactions or is admin
    if (
      req.user._id.toString() !== req.params.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const transactions = await Transaction.find({
      $or: [{ buyerId: req.params.id }, { sellerId: req.params.id }],
    })
      .populate("buyerId", "name")
      .populate("sellerId", "name")
      .populate("listingId", "title price")
      .sort("-createdAt");

    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get user's reviews
// @route   GET /api/users/:id/reviews
// @access  Private
const getUserReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ reviewedUserId: req.params.id })
      .populate("reviewerId", "name")
      .populate("listingId", "title")
      .sort("-createdAt");

    res.json(reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Search users
// @route   GET /api/users/search
// @access  Private
const searchUsers = async (req, res) => {
  try {
    const { name, department } = req.query;
    let query = {};

    if (name) {
      query.name = { $regex: name, $options: "i" };
    }

    if (department) {
      query.department = { $regex: department, $options: "i" };
    }

    const users = await User.find(query)
      .select("name email department rating totalReviews")
      .limit(50);

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getUserById,
  getUserListings,
  getUserTransactions,
  getUserReviews,
  searchUsers,
};
