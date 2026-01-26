const Notification = require("../models/Notification");

class NotificationService {
  async createNotification(userId, message, type = "System", relatedId = null) {
    try {
      const notification = await Notification.create({
        userId,
        message,
        type,
        relatedId,
      });
      return notification;
    } catch (error) {
      console.error("Error creating notification:", error);
      return null;
    }
  }

  async createTransactionNotification(
    buyerId,
    sellerId,
    listingId,
    transactionType,
  ) {
    const buyerMessage = `Your ${transactionType} request has been received.`;
    const sellerMessage = `You have a new ${transactionType} request for your listing.`;

    await Promise.all([
      this.createNotification(buyerId, buyerMessage, "Transaction", listingId),
      this.createNotification(
        sellerId,
        sellerMessage,
        "Transaction",
        listingId,
      ),
    ]);
  }

  async createMessageNotification(receiverId, senderName) {
    const message = `You have a new message from ${senderName}.`;
    await this.createNotification(receiverId, message, "Message");
  }

  async getUserNotifications(userId, limit = 20) {
    try {
      const notifications = await Notification.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      // Mark as read
      await Notification.updateMany(
        { userId, isRead: false },
        { isRead: true },
      );

      return notifications;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return [];
    }
  }

  async getUnreadCount(userId) {
    try {
      return await Notification.countDocuments({
        userId,
        isRead: false,
      });
    } catch (error) {
      console.error("Error counting unread notifications:", error);
      return 0;
    }
  }
}

module.exports = new NotificationService();
