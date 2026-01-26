const User = require("../models/User");
const Listing = require("../models/Listing");
const Transaction = require("../models/Transaction");
const Report = require("../models/Report");
const Review = require("../models/Review");

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, role } = req.query;

    let query = {};
    if (status) query.status = status;
    if (role) query.role = role;

    const users = await User.find(query)
      .select("-password -verificationCode")
      .sort("-createdAt")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
const updateUserStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    const validStatuses = ["active", "suspended", "banned"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Cannot modify admin users
    if (
      user.role === "admin" &&
      req.user._id.toString() !== user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Cannot modify other admin users" });
    }

    user.status = status;

    if (reason) {
      user.suspensionReason = reason;
    }

    await user.save();

    res.json({
      message: `User status updated to ${status}`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get all listings
// @route   GET /api/admin/listings
// @access  Private/Admin
const getAllListings = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, category } = req.query;

    let query = {};
    if (status) query.status = status;
    if (category) query.category = category;

    const listings = await Listing.find(query)
      .populate("sellerId", "name email")
      .sort("-createdAt")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Listing.countDocuments(query);

    res.json({
      listings,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update listing status
// @route   PUT /api/admin/listings/:id/status
// @access  Private/Admin
const updateListingStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    const validStatuses = ["Available", "Hidden", "Removed"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    listing.status = status;
    if (reason) {
      listing.adminNotes = reason;
    }

    await listing.save();

    res.json({
      message: `Listing status updated to ${status}`,
      listing,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get all transactions
// @route   GET /api/admin/transactions
// @access  Private/Admin
const getAllTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 50, status } = req.query;

    let query = {};
    if (status) query.status = status;

    const transactions = await Transaction.find(query)
      .populate("buyerId", "name email")
      .populate("sellerId", "name email")
      .populate("listingId", "title")
      .sort("-createdAt")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Transaction.countDocuments(query);

    res.json({
      transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalListings,
      activeListings,
      totalTransactions,
      completedTransactions,
      pendingReports,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: "active" }),
      Listing.countDocuments(),
      Listing.countDocuments({ status: "Available" }),
      Transaction.countDocuments(),
      Transaction.countDocuments({ status: "Completed" }),
      Report.countDocuments({ status: "Pending" }),
    ]);

    // Recent activities
    const recentUsers = await User.find()
      .sort("-createdAt")
      .limit(5)
      .select("name email createdAt");

    const recentListings = await Listing.find()
      .sort("-createdAt")
      .limit(5)
      .populate("sellerId", "name")
      .select("title price status createdAt");

    const recentTransactions = await Transaction.find()
      .sort("-createdAt")
      .limit(5)
      .populate("buyerId", "name")
      .populate("sellerId", "name")
      .select("amount status createdAt");

    res.json({
      overview: {
        totalUsers,
        activeUsers,
        totalListings,
        activeListings,
        totalTransactions,
        completedTransactions,
        pendingReports,
      },
      recentActivities: {
        users: recentUsers,
        listings: recentListings,
        transactions: recentTransactions,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get all reports
// @route   GET /api/admin/reports
// @access  Private/Admin
const getReports = async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;

    let query = {};
    if (status) query.status = status;

    const reports = await Report.find(query)
      .populate("reporterId", "name email")
      .populate("reportedUserId", "name email")
      .populate("listingId", "title")
      .sort("-createdAt")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Report.countDocuments(query);

    res.json({
      reports,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllUsers,
  updateUserStatus,
  getAllListings,
  updateListingStatus,
  getAllTransactions,
  getDashboardStats,
  getReports,
};
