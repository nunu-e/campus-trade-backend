db = db.getSiblingDB("campustrade");

// Create collections
db.createCollection("users");
db.createCollection("listings");
db.createCollection("transactions");
db.createCollection("messages");
db.createCollection("reviews");
db.createCollection("reports");
db.createCollection("notifications");

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ status: 1 });
db.users.createIndex({ role: 1 });

db.listings.createIndex({ sellerId: 1 });
db.listings.createIndex({ status: 1 });
db.listings.createIndex({ category: 1 });
db.listings.createIndex({ location: 1 });
db.listings.createIndex({ price: 1 });
db.listings.createIndex({ title: "text", description: "text" });

db.transactions.createIndex({ buyerId: 1 });
db.transactions.createIndex({ sellerId: 1 });
db.transactions.createIndex({ listingId: 1 });
db.transactions.createIndex({ status: 1 });

db.messages.createIndex({ senderId: 1, receiverId: 1 });
db.messages.createIndex({ createdAt: -1 });
db.messages.createIndex({ isRead: 1 });

db.reviews.createIndex({ reviewedUserId: 1 });
db.reviews.createIndex({ transactionId: 1 });
db.reviews.createIndex({ reviewerId: 1, transactionId: 1 }, { unique: true });

db.reports.createIndex({ status: 1 });
db.reports.createIndex({ reporterId: 1 });
db.reports.createIndex({ reportedUserId: 1 });
db.reports.createIndex({ createdAt: -1 });

db.notifications.createIndex({ userId: 1 });
db.notifications.createIndex({ isRead: 1 });
db.notifications.createIndex({ createdAt: -1 });

print("CampusTrade database initialized successfully!");
