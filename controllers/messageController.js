const Message = require("../models/Message");
const User = require("../models/User");

// @desc    Send a message
// @route   POST /api/messages
// @access  Private/Verified
const sendMessage = async (req, res) => {
  try {
    const { receiverId, content, listingId } = req.body;

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    // Cannot message yourself
    if (receiverId === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot message yourself" });
    }
    if (listingId) {
      const listing = await Listing.findById(listingId);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
    }

    const message = await Message.create({
      senderId: req.user._id,
      receiverId,
      content,
      listingId,
    });

    // Populate sender info for response
    const populatedMessage = await Message.findById(message._id)
      .populate("senderId", "name email")
      .populate("receiverId", "name email");

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get conversation between two users
// @route   GET /api/messages/conversation/:userId
// @access  Private/Verified
const getConversation = async (req, res) => {
  try {
    const otherUserId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { senderId: req.user._id, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: req.user._id },
      ],
    })
      .populate("senderId", "name email")
      .populate("receiverId", "name email")
      .sort("createdAt");

    // Mark messages as read
    await Message.updateMany(
      {
        senderId: otherUserId,
        receiverId: req.user._id,
        isRead: false,
      },
      { isRead: true },
    );

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get all user conversations
// @route   GET /api/messages/conversations
// @access  Private/Verified
const getUserConversations = async (req, res) => {
  try {
    // Get distinct users that the current user has conversed with
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ senderId: req.user._id }, { receiverId: req.user._id }],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: {
              if: { $eq: ["$senderId", req.user._id] },
              then: "$receiverId",
              else: "$senderId",
            },
          },
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$receiverId", req.user._id] },
                    { $eq: ["$isRead", false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          userId: "$_id",
          userName: "$user.name",
          userEmail: "$user.email",
          lastMessage: "$lastMessage.content",
          lastMessageTime: "$lastMessage.createdAt",
          unreadCount: 1,
        },
      },
      {
        $sort: { lastMessageTime: -1 },
      },
    ]);

    res.json(conversations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Mark message as read
// @route   PUT /api/messages/:messageId/read
// @access  Private/Verified
const markAsRead = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check authorization
    if (message.receiverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    message.isRead = true;
    await message.save();

    res.json({ message: "Message marked as read" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get unread message count
// @route   GET /api/messages/unread-count
// @access  Private/Verified
const getUnreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiverId: req.user._id,
      isRead: false,
    });

    res.json({ unreadCount: count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  sendMessage,
  getConversation,
  getUserConversations,
  markAsRead,
  getUnreadCount,
};
