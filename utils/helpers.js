const crypto = require("crypto");

const generateVerificationCode = () => {
  return crypto.randomBytes(20).toString("hex");
};

const generateTransactionId = () => {
  return `TXN-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
};

const formatPrice = (price) => {
  return new Intl.NumberFormat("et-ET", {
    style: "currency",
    currency: "ETB",
  }).format(price);
};

const calculateAverageRating = (reviews) => {
  if (!reviews || reviews.length === 0) return 0;
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return parseFloat((total / reviews.length).toFixed(1));
};

const isValidImageType = (mimetype) => {
  const validTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  return validTypes.includes(mimetype);
};

const getTimeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);

  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return `${interval} year${interval > 1 ? "s" : ""} ago`;

  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return `${interval} month${interval > 1 ? "s" : ""} ago`;

  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return `${interval} day${interval > 1 ? "s" : ""} ago`;

  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return `${interval} hour${interval > 1 ? "s" : ""} ago`;

  interval = Math.floor(seconds / 60);
  if (interval >= 1) return `${interval} minute${interval > 1 ? "s" : ""} ago`;

  return `${Math.floor(seconds)} second${seconds > 1 ? "s" : ""} ago`;
};

module.exports = {
  generateVerificationCode,
  generateTransactionId,
  formatPrice,
  calculateAverageRating,
  isValidImageType,
  getTimeAgo,
};
