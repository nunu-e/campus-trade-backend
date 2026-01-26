const express = require("express");
const router = express.Router();
const { protect, verified } = require("../middleware/authMiddleware");
const {
  sendMessage,
  getConversation,
  getUserConversations,
  markAsRead,
  getUnreadCount,
} = require("../controllers/messageController");

router.route("/").post(protect, verified, sendMessage);

router.get("/conversations", protect, verified, getUserConversations);
router.get("/conversation/:userId", protect, verified, getConversation);
router.get("/unread-count", protect, verified, getUnreadCount);
router.put("/:messageId/read", protect, verified, markAsRead);

module.exports = router;
