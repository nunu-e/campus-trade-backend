const User = require("../models/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const emailService = require("../services/emailService");
const authService = require("../services/authService");

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, phoneNumber, department, studentID } =
      req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Validate AAU email
    if (!email.endsWith("@aau.edu.et")) {
      return res
        .status(400)
        .json({ message: "Please use your AAU email address" });
    }

    // Generate verification code
    const verificationCode = crypto.randomBytes(20).toString("hex");

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phoneNumber,
      department,
      studentID,
      verificationCode,
    });

    if (user) {
      // In production: Send verification email
      // await emailService.sendVerificationEmail(user.email, user.name, verificationCode);

      // For development, log the verification link
      if (process.env.NODE_ENV === "development") {
        console.log(
          "Verification link:",
          `${process.env.APP_URL || "http://localhost:3000"}/verify/${verificationCode}`,
        );
      }

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
        message: "Registration successful. Please verify your email.",
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      if (user.status !== "active") {
        return res.status(403).json({
          message: `Account is ${user.status}. Please contact administration.`,
        });
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Verify email
// @route   GET /api/auth/verify/:code
// @access  Public
const verifyEmail = async (req, res) => {
  try {
    const { code } = req.params;

    const user = await User.findOne({ verificationCode: code });

    if (!user) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    await user.save();

    // Send welcome email
    // await emailService.sendWelcomeEmail(user.email, user.name);

    res.json({
      message: "Email verified successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "-password -verificationCode",
    );

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.phoneNumber = req.body.phoneNumber || user.phoneNumber;
      user.department = req.body.department || user.department;

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
        department: updatedUser.department,
        role: updatedUser.role,
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  verifyEmail,
  getUserProfile,
  updateUserProfile,
};
