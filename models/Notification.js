const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ["System", "Transaction", "Message", "Review", "Admin"],
    default: "System",
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "relatedModel",
  },
  relatedModel: {
    type: String,
    enum: ["Listing", "Transaction", "Message", "Review", null],
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient querying
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
