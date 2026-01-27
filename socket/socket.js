const socketIO = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Message = require("../models/Message");
const NotificationService = require("../services/notificationService");

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

      if (!token) return next(new Error("Authentication error"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) return next(new Error("User not found"));

      // Attach user info
      socket.userId = user._id.toString();
      socket.user = {
        name: user.name,
        role: user.role,
      };

      next();
    } catch (error) {
      console.error("Socket auth failed:", error.message);
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join user's personal room
    socket.join(`user:${socket.userId}`);

    /** SEND MESSAGE */
    socket.on("sendMessage", async ({ receiverId, content, listingId }) => {
      try {
        const receiver = await User.findById(receiverId);
        if (!receiver) {
          socket.emit("messageError", { message: "Receiver not found" });
          return;
        }

        const message = await Message.create({
          senderId: socket.userId,
          receiverId,
          content,
          listingId,
        });

        const populatedMessage = await Message.findById(message._id)
          .populate("senderId", "name email")
          .populate("receiverId", "name email");

        // Send message to receiver and sender
        io.to(`user:${receiverId}`).emit("newMessage", populatedMessage);
        socket.emit("newMessage", populatedMessage);

        // Create notification using NotificationService
        await NotificationService.createNotification(
          receiverId,
          `New message from ${socket.user.name}`,
          "Message",
          message._id,
        );

        // Emit notification to receiver
        io.to(`user:${receiverId}`).emit("notification", {
          type: "message",
          message: `New message from ${socket.user.name}`,
          data: populatedMessage,
        });
      } catch (err) {
        console.error("Error sending message:", err);
        socket.emit("messageError", { message: "Failed to send message" });
      }
    });

    /** TYPING INDICATOR */
    socket.on("typing", ({ receiverId, isTyping }) => {
      io.to(`user:${receiverId}`).emit("typing", {
        userId: socket.userId,
        userName: socket.user.name,
        isTyping,
      });
    });

    /** READ RECEIPTS */
    socket.on("markAsRead", async (messageId) => {
      try {
        const message = await Message.findById(messageId);
        if (message && message.receiverId.toString() === socket.userId) {
          message.isRead = true;
          await message.save();

          io.to(`user:${message.senderId}`).emit("messageRead", {
            messageId: message._id,
            readAt: new Date(),
          });
        }
      } catch (err) {
        console.error("Error marking message as read:", err);
      }
    });

    /** TRANSACTION NOTIFICATIONS */
    socket.on(
      "transactionUpdate",
      async ({ transactionId, userId, message }) => {
        try {
          const notification = await NotificationService.createNotification(
            userId,
            message,
            "Transaction",
            transactionId,
          );

          io.to(`user:${userId}`).emit("notification", {
            type: "transaction",
            message,
            data: notification,
          });
        } catch (err) {
          console.error("Error sending transaction notification:", err);
        }
      },
    );

    /** USER DISCONNECTION */
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.userId}`);
      socket.broadcast.emit("userStatus", {
        userId: socket.userId,
        status: "offline",
      });
    });
  });

  return io;
};

module.exports = setupWebSocket;
