module.exports = {
  // User roles
  ROLES: {
    USER: "user",
    ADMIN: "admin",
  },

  // User statuses
  USER_STATUS: {
    ACTIVE: "active",
    SUSPENDED: "suspended",
    BANNED: "banned",
  },

  // Listing statuses
  LISTING_STATUS: {
    AVAILABLE: "Available",
    RESERVED: "Reserved",
    SOLD: "Sold",
    HIDDEN: "Hidden",
    REMOVED: "Removed",
  },

  // Listing categories
  CATEGORIES: {
    GOODS: "Goods",
    SERVICES: "Services",
    RENTALS: "Rentals",
  },

  // Goods subcategories
  GOODS_SUBCATEGORIES: [
    "Textbooks",
    "Electronics",
    "Dorm Essentials",
    "Clothing",
    "Furniture",
    "Stationery",
    "Sports Equipment",
    "Other",
  ],

  // Services subcategories
  SERVICES_SUBCATEGORIES: [
    "Tutoring",
    "Writing Assistance",
    "Graphic Design",
    "Programming",
    "Research Assistance",
    "Photography",
    "Transportation",
    "Other",
  ],

  // Rentals subcategories
  RENTALS_SUBCATEGORIES: [
    "Books",
    "Electronics",
    "Clothing",
    "Kitchen Appliances",
    "Sports Equipment",
    "Furniture",
    "Other",
  ],

  // Campus locations
  CAMPUS_LOCATIONS: [
    "Main Campus",
    "Engineering Campus",
    "Science Campus",
    "Medical Campus",
    "Other",
  ],

  // Transaction statuses
  TRANSACTION_STATUS: {
    INITIATED: "Initiated",
    RESERVED: "Reserved",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  },

  // Report reasons
  REPORT_REASONS: [
    "Inappropriate Content",
    "Fraudulent Activity",
    "Harassment",
    "Prohibited Item",
    "Misleading Information",
    "Other",
  ],

  // Notification types
  NOTIFICATION_TYPES: {
    SYSTEM: "System",
    TRANSACTION: "Transaction",
    MESSAGE: "Message",
    REVIEW: "Review",
    ADMIN: "Admin",
  },
};
