const crypto = require("crypto");

/**
 * Generate a 6-digit numeric OTP
 */
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Check if OTP is expired
 */
const isOTPExpired = (expiresAt) => {
  return Date.now() > new Date(expiresAt).getTime();
};

/**
 * Hash OTP with secret (optional)
 */
const hashOTP = (otp) => {
  return crypto
    .createHmac("sha256", process.env.OTP_HASH_SECRET)
    .update(otp)
    .digest("hex");
};

module.exports = { generateOTP, isOTPExpired, hashOTP };
