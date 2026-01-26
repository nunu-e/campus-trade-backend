const Transaction = require("../models/Transaction");
const Listing = require("../models/Listing");
const User = require("../models/User");

// @desc    Create a transaction (when buyer reserves)
// @route   POST /api/transactions
// @access  Private/Verified
const createTransaction = async (req, res) => {
  try {
    const { listingId } = req.body;

    const listing = await Listing.findById(listingId);

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    if (listing.status !== "Available") {
      return res.status(400).json({ message: "Listing is not available" });
    }

    if (listing.sellerId.toString() === req.user._id.toString()) {
      return res
        .status(400)
        .json({ message: "Cannot purchase your own listing" });
    }

    // Create transaction
    const transaction = await Transaction.create({
      buyerId: req.user._id,
      sellerId: listing.sellerId,
      listingId: listing._id,
      amount: listing.price,
    });

    // Update listing status
    listing.status = "Reserved";
    await listing.save();

    res.status(201).json(transaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get transaction by ID
// @route   GET /api/transactions/:id
// @access  Private/Verified
const getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate("buyerId", "name email phoneNumber")
      .populate("sellerId", "name email phoneNumber")
      .populate("listingId", "title price images");

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Check authorization
    if (
      transaction.buyerId._id.toString() !== req.user._id.toString() &&
      transaction.sellerId._id.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.json(transaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get user's transactions
// @route   GET /api/transactions/my-transactions
// @access  Private/Verified
const getUserTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({
      $or: [{ buyerId: req.user._id }, { sellerId: req.user._id }],
    })
      .populate("buyerId", "name")
      .populate("sellerId", "name")
      .populate("listingId", "title price images")
      .sort("-createdAt");

    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update transaction status (for seller to mark as sold)
// @route   PUT /api/transactions/:id/status
// @access  Private/Verified
const updateTransactionStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Check if user is the seller
    if (transaction.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Only seller can mark as completed
    if (status === "Completed") {
      transaction.status = "Completed";
      transaction.paymentStatus = "Completed";
      transaction.completionDate = new Date();

      // Update listing status
      await Listing.findByIdAndUpdate(transaction.listingId, {
        status: "Sold",
      });

      await transaction.save();
      res.json({ message: "Transaction marked as completed", transaction });
    } else {
      res.status(400).json({ message: "Invalid status update" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Cancel transaction
// @route   PUT /api/transactions/:id/cancel
// @access  Private/Verified
const cancelTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Check authorization (only buyer or seller can cancel)
    if (
      transaction.buyerId.toString() !== req.user._id.toString() &&
      transaction.sellerId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Update transaction
    transaction.status = "Cancelled";
    transaction.paymentStatus = "Cancelled";
    transaction.cancellationDate = new Date();
    transaction.cancellationReason = req.body.reason || "Cancelled by user";

    // Update listing status back to Available
    await Listing.findByIdAndUpdate(transaction.listingId, {
      status: "Available",
    });

    await transaction.save();
    res.json({ message: "Transaction cancelled", transaction });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Complete transaction (buyer confirms)
// @route   PUT /api/transactions/:id/complete
// @access  Private/Verified
const completeTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Check if user is the buyer
    if (transaction.buyerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Update transaction
    transaction.status = "Completed";
    transaction.paymentStatus = "Completed";
    transaction.completionDate = new Date();

    // Update listing status
    await Listing.findByIdAndUpdate(transaction.listingId, { status: "Sold" });

    await transaction.save();
    res.json({ message: "Transaction completed", transaction });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createTransaction,
  getTransactionById,
  getUserTransactions,
  updateTransactionStatus,
  cancelTransaction,
  completeTransaction,
};
