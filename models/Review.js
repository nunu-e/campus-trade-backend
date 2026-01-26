const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  reviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  reviewedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Transaction",
    required: true,
  },
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Listing",
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  type: {
    type: String,
    enum: ["BuyerToSeller", "SellerToBuyer"],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update updatedAt on save
reviewSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Ensure one review per user per transaction
reviewSchema.index({ reviewerId: 1, transactionId: 1 }, { unique: true });

// Index for efficient querying
reviewSchema.index({ reviewedUserId: 1, createdAt: -1 });
reviewSchema.index({ listingId: 1 });

module.exports = mongoose.model("Review", reviewSchema);
