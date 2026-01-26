const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Listing",
  },
  content: {
    type: String,
    required: [true, "Message content is required"],
    trim: true,
    maxlength: 1000,
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
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
messageSchema.index({ listingId: 1 });

module.exports = mongoose.model("Message", messageSchema);
