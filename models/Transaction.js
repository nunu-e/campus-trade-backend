const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Listing",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  paymentStatus: {
    type: String,
    enum: ["Pending", "Completed", "Cancelled"],
    default: "Pending",
  },
  status: {
    type: String,
    enum: ["Initiated", "Reserved", "Completed", "Cancelled"],
    default: "Initiated",
  },
  reservationDate: {
    type: Date,
    default: Date.now,
  },
  completionDate: Date,
  cancellationDate: Date,
  cancellationReason: String,
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
transactionSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes
transactionSchema.index({ buyerId: 1, status: 1 });
transactionSchema.index({ sellerId: 1, status: 1 });
transactionSchema.index({ listingId: 1 });

module.exports = mongoose.model("Transaction", transactionSchema);
