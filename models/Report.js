const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  reporterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  reportedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Listing",
  },
  reason: {
    type: String,
    required: true,
    enum: [
      "Inappropriate Content",
      "Fraudulent Activity",
      "Harassment",
      "Prohibited Item",
      "Misleading Information",
      "Other",
    ],
  },
  description: {
    type: String,
    required: true,
    maxlength: 500,
  },
  status: {
    type: String,
    enum: ["Pending", "Under Review", "Resolved", "Rejected"],
    default: "Pending",
  },
  adminNotes: String,
  resolvedAt: Date,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
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
reportSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ reporterId: 1 });
reportSchema.index({ reportedUserId: 1 });
reportSchema.index({ listingId: 1 });

module.exports = mongoose.model("Report", reportSchema);
