const User = require("../models/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const emailService = require("../services/emailService");
const { generateOTP, isOTPExpired, hashOTP } = require("../utils/otp");
// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "fallback_secret", {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    console.log("Registration attempt:", {
      email: req.body.email,
      name: req.body.name,
    });

    const { name, email, password, phoneNumber, department, studentID } =
      req.body;

    // Validate required fields
    const requiredFields = [
      "name",
      "email",
      "password",
      "department",
      "studentID",
    ];
    const missingFields = requiredFields.filter((field) => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    // Create user (without old verification fields)
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password,
      phoneNumber: phoneNumber ? phoneNumber.trim() : "",
      department: department.trim(),
      studentID: studentID.trim(),
      isVerified: false,
    });

    console.log("User created successfully:", user._id);

    // Generate OTP
    const otpCode = generateOTP();
    user.otpCode = otpCode;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    user.otpAttempts = 0;
    await user.save();

    // Send OTP email
    let emailSent = false;
    if (process.env.ENABLE_EMAILS === "true") {
      const result = await emailService.sendOTPEmail(
        user.email,
        user.name,
        otpCode,
      );
      if (result && result.success) emailSent = true;
    } else {
      console.log(`[DEV MODE] OTP for ${user.email}: ${otpCode}`);
      emailSent = true;
    }

    // Generate token (optional – you can require verification before login)
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: emailSent
        ? "Registration successful! Please check your email for the verification code."
        : "Registration successful but we could not send the verification code. Please contact support.",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        department: user.department,
      },
      ...(process.env.ENABLE_EMAILS !== "true" && { devOtp: otpCode }),
    });
  } catch (error) {
    console.error("Registration error:", error);
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res
        .status(400)
        .json({ success: false, message: "Validation failed", errors });
    }
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ success: false, message: "Duplicate field value entered" });
    }
    res.status(500).json({
      success: false,
      message: "Server error during registration",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password",
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check user status
    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: `Account is ${user.status}`,
      });
    }

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email first",
        needsVerification: true,
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: "Login successful",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        department: user.department,
        token: token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

// @desc    Verify email
// @route   GET /api/auth/verify/:code
// @access  Public
const verifyEmail = async (req, res) => {
  try {
    const { code } = req.params;

    // Find user by verification code
    const user = await User.findOne({
      verificationCode: code,
      verificationCodeExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code",
      });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.json({
        success: true,
        message: "Email already verified",
      });
    }

    // Verify user
    user.isVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    await user.save();

    // Send welcome email
    if (process.env.ENABLE_EMAILS === "true") {
      try {
        await emailService.sendWelcomeEmail(user.email, user.name);
      } catch (emailError) {
        console.warn("Failed to send welcome email:", emailError.message);
      }
    }

    res.json({
      success: true,
      message: "Email verified successfully! You can now login.",
    });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during verification",
    });
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email already verified",
      });
    }

    // Generate new verification code
    const verificationCode = crypto.randomBytes(20).toString("hex");
    user.verificationCode = verificationCode;
    user.verificationCodeExpires = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    // Construct verification link
    const verificationLink = `${process.env.APP_URL || "http://localhost:3000"}/verify/${verificationCode}`;

    // Send verification email
    let emailSent = false;
    let emailError = null;

    if (process.env.ENABLE_EMAILS === "true") {
      try {
        const emailResult = await Promise.race([
          emailService.sendVerificationEmail(
            user.email,
            user.name,
            verificationCode,
          ),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Email timeout")), 5000),
          ),
        ]);

        if (emailResult && emailResult.success) {
          emailSent = true;
          console.log(
            "✅ Resend verification email sent successfully to:",
            user.email,
          );
        } else {
          emailError = emailResult?.error || "Unknown error";
          console.warn("⚠️ Resend email service returned failure:", emailError);
        }
      } catch (error) {
        emailError = error.message || "Failed to send email";
        console.error("❌ Failed to resend verification email:", emailError);
      }

      if (emailSent) {
        res.json({
          success: true,
          message:
            "Verification email sent successfully. Please check your inbox.",
        });
      } else {
        res.status(500).json({
          success: false,
          message:
            emailError ||
            "Failed to send verification email. Please try again later.",
        });
      }
    } else {
      // Development mode: return verification link
      console.log("═══════════════════════════════════════════════════════");
      console.log("📧 DEVELOPMENT MODE - Resend Verification Email");
      console.log("═══════════════════════════════════════════════════════");
      console.log(`To: ${user.email}`);
      console.log(`Name: ${user.name}`);
      console.log(`Verification Link: ${verificationLink}`);
      console.log(`Verification Code: ${verificationCode}`);
      console.log("═══════════════════════════════════════════════════════");

      res.json({
        success: true,
        message: "Development mode: Use this verification link",
        verificationLink: verificationLink,
      });
    }
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
// @desc    Resend OTP for verification
// @route   POST /api/auth/send-otp
// @access  Public
const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Prevent email enumeration
      return res.status(200).json({
        success: true,
        message:
          "If that email is registered and unverified, an OTP has been sent.",
      });
    }

    if (user.isVerified) {
      return res
        .status(400)
        .json({ success: false, message: "Email already verified" });
    }

    // Rate limiting: lock if too many attempts
    if (user.otpLockUntil && Date.now() < user.otpLockUntil) {
      const minutesLeft = Math.ceil((user.otpLockUntil - Date.now()) / 60000);
      return res.status(429).json({
        success: false,
        message: `Too many attempts. Try again in ${minutesLeft} minutes.`,
      });
    }

    // Generate new OTP
    const newOtp = generateOTP();
    user.otpCode = newOtp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    user.otpAttempts = 0; // reset
    await user.save();

    // Send email
    let emailSent = false;
    if (process.env.ENABLE_EMAILS === "true") {
      const result = await emailService.sendOTPEmail(
        user.email,
        user.name,
        newOtp,
      );
      if (result && result.success) emailSent = true;
    } else {
      console.log(`[DEV MODE] OTP for ${user.email}: ${newOtp}`);
      emailSent = true;
    }

    if (!emailSent) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to send OTP email" });
    }

    res.json({
      success: true,
      message: "Verification code sent. Check your email.",
      ...(process.env.ENABLE_EMAILS !== "true" && { devOtp: newOtp }),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    console.log("=== VERIFY OTP START ===");
    console.log("Email:", email, "OTP:", otp);

    if (!email || !otp) {
      return res
        .status(400)
        .json({ success: false, message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log("User not found");
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    console.log("User found:", user._id);
    console.log("User.isVerified:", user.isVerified);
    console.log("Stored OTP Code:", user.otpCode, "Type:", typeof user.otpCode);
    console.log("Received OTP:", otp, "Type:", typeof otp);
    console.log("OTP Expires at:", user.otpExpires);

    if (user.isVerified) {
      return res
        .status(400)
        .json({ success: false, message: "Email already verified" });
    }

    // Check lock
    if (user.otpLockUntil && Date.now() < user.otpLockUntil) {
      const minutesLeft = Math.ceil((user.otpLockUntil - Date.now()) / 60000);
      return res.status(429).json({
        success: false,
        message: `Too many failed attempts. Try again in ${minutesLeft} minutes.`,
      });
    }

    // Compare as strings (ensure both are strings)
    const storedOtp = user.otpCode ? user.otpCode.toString() : null;
    const enteredOtp = otp.toString();

    console.log("Stored OTP (string):", storedOtp);
    console.log("Entered OTP (string):", enteredOtp);
    console.log("Do they match?", storedOtp === enteredOtp);

    if (!storedOtp || storedOtp !== enteredOtp) {
      // Increment attempts
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      if (user.otpAttempts >= 5) {
        user.otpLockUntil = Date.now() + 15 * 60 * 1000;
        user.otpAttempts = 0;
        await user.save();
        return res.status(429).json({
          success: false,
          message: "Too many failed attempts. Try again in 15 minutes.",
        });
      }
      await user.save();
      return res
        .status(400)
        .json({ success: false, message: "Invalid verification code" });
    }

    // Check expiration
    const now = Date.now();
    const expiresAt = new Date(user.otpExpires).getTime();
    console.log("Current time:", now, "Expires at:", expiresAt);
    if (now > expiresAt) {
      return res
        .status(400)
        .json({ success: false, message: "Code expired. Request a new one." });
    }

    // Mark verified
    user.isVerified = true;
    user.otpCode = null;
    user.otpExpires = null;
    user.otpAttempts = 0;
    user.otpLockUntil = null;
    await user.save();

    // Generate token only after successful verification
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: "Email verified successfully!",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: true,
      },
    });
  } catch (error) {
    console.error("VERIFY OTP ERROR:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
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

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update allowed fields
    user.name = req.body.name || user.name;
    user.phoneNumber = req.body.phoneNumber || user.phoneNumber;
    user.department = req.body.department || user.department;

    const updatedUser = await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
        department: updatedUser.department,
        isVerified: updatedUser.isVerified,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Forgot password - send reset email
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Do not reveal that email doesn't exist
      console.log(`Password reset requested for non-existent email: ${email}`);
      return res.json({
        success: true,
        message:
          "If that email address is registered, you will receive a password reset link.",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetTokenHashed = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = resetTokenHashed;
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour

    await user.save();

    // Build reset link
    const resetLink = `${process.env.APP_URL || "http://localhost:3000"}/reset-password/${resetToken}`;

    // Send email (best-effort)
    if (process.env.ENABLE_EMAILS === "true") {
      try {
        await emailService.sendResetPasswordEmail(
          user.email,
          user.name,
          resetLink,
        );
      } catch (err) {
        console.warn("Failed to send reset email:", err.message);
      }
    }

    res.json({
      success: true,
      message: "Password reset email sent (if email is configured)",
      resetLink: process.env.ENABLE_EMAILS === "true" ? undefined : resetLink,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset/:token
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res
        .status(400)
        .json({ success: false, message: "Password is required" });
    }

    const hashed = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpire: { $gt: Date.now() },
    }).select("+password");

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired reset token" });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({
      success: true,
      message: "Password has been reset. You can now login.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  verifyEmail,
  resendVerification,
  getUserProfile,
  updateUserProfile,
  forgotPassword,
  resetPassword,
  sendOTP,
  verifyOTP,
};
