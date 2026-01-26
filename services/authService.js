const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");

class AuthService {
  generateToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || "30d",
    });
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return null;
    }
  }

  generateVerificationCode() {
    return crypto.randomBytes(20).toString("hex");
  }

  async validateAAUEmail(email) {
    // Validate AAU email format
    const aauEmailRegex = /^[a-zA-Z0-9._%+-]+@aau\.edu\.et$/;
    return aauEmailRegex.test(email);
  }

  async validatePassword(password) {
    // Minimum 6 characters, at least one letter and one number
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/;
    return passwordRegex.test(password);
  }

  async checkExistingUser(email) {
    return await User.findOne({ email: email.toLowerCase() });
  }
}

module.exports = new AuthService();
