const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "fallback_secret",
      );

      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      return next();
    } catch (error) {
      console.error("Token verification error:", error);
      return res.status(401).json({
        success: false,
        message: "Not authorized, token failed",
      });
    }
  }

  return res.status(401).json({
    success: false,
    message: "Not authorized, no token",
  });
};

// ✅ ADD THIS
const verified = (req, res, next) => {
  if (!req.user || req.user.isVerified !== true) {
    return res.status(403).json({
      success: false,
      message: "User account is not verified",
    });
  }
  next();
};

module.exports = { protect, verified };
