const socketIO = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Message = require("../models/Message");
const Notification = require("../models/Notification");

const setupWebSocket = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      credentials: true,
    },
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication error"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new Error("User not found"));
      }

      socket.userId = user._id;
      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join user's personal room
    socket.join(`user:${socket.userId}`);

    // Handle sending messages
    socket.on("sendMessage", async (data) => {
      try {
        const { receiverId, content, listingId } = data;

        // Validate receiver
        const receiver = await User.findById(receiverId);
        if (!receiver) {
          socket.emit("error", { message: "Receiver not found" });
          return;
        }

        // Create message in database
        const message = await Message.create({
          senderId: socket.userId,
          receiverId,
          content,
          listingId,
        });

        // Populate for sending
        const populatedMessage = await Message.findById(message._id)
          .populate("senderId", "name email")
          .populate("receiverId", "name email");

        // Send to receiver
        io.to(`user:${receiverId}`).emit("newMessage", populatedMessage);

        // Also send to sender (for confirmation)
        socket.emit("newMessage", populatedMessage);

        // Create notification for receiver
        await Notification.create({
          userId: receiverId,
          message: `New message from ${socket.user.name}`,
          type: "Message",
          relatedId: message._id,
        });

        // Send notification to receiver
        io.to(`user:${receiverId}`).emit("notification", {
          type: "message",
          message: `New message from ${socket.user.name}`,
          data: populatedMessage,
        });
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Handle typing indicator
    socket.on("typing", (data) => {
      const { receiverId, isTyping } = data;
      io.to(`user:${receiverId}`).emit("typing", {
        userId: socket.userId,
        userName: socket.user.name,
        isTyping,
      });
    });

    // Handle read receipts
    socket.on("markAsRead", async (messageId) => {
      try {
        const message = await Message.findById(messageId);

        if (
          message &&
          message.receiverId.toString() === socket.userId.toString()
        ) {
          message.isRead = true;
          await message.save();

          // Notify sender that message was read
          io.to(`user:${message.senderId}`).emit("messageRead", {
            messageId: message._id,
            readAt: new Date(),
          });
        }
      } catch (error) {
        console.error("Error marking message as read:", error);
      }
    });

    // Handle transaction notifications
    socket.on("transactionUpdate", async (data) => {
      try {
        const { transactionId, userId, message } = data;

        // Create notification
        const notification = await Notification.create({
          userId,
          message,
          type: "Transaction",
          relatedId: transactionId,
        });

        // Send notification
        io.to(`user:${userId}`).emit("notification", {
          type: "transaction",
          message,
          data: notification,
        });
      } catch (error) {
        console.error("Error sending transaction notification:", error);
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.userId}`);

      // Broadcast user offline status
      socket.broadcast.emit("userStatus", {
        userId: socket.userId,
        status: "offline",
      });
    });
  });

  return io;
};

module.exports = setupWebSocket;
