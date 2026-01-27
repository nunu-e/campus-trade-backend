const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    minlength: [2, "Name must be at least 2 characters"],
    maxlength: [50, "Name cannot exceed 50 characters"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function (v) {
        // Accept any valid email address
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: "Please enter a valid email address",
    },
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters"],
    select: false,
  },
  phoneNumber: {
    type: String,
    trim: true,
    default: "",
  },
  department: {
    type: String,
    required: [true, "Department is required"],
    trim: true,
  },
  studentID: {
    type: String,
    required: [true, "Student ID is required"],
    trim: true,
  },
  status: {
    type: String,
    enum: ["active", "suspended", "banned"],
    default: "active",
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationCode: {
    type: String,
    default: null,
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  totalReviews: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  // Only hash the password if it's modified (or new)
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Update updatedAt timestamp on save
userSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile (without sensitive data)
userSchema.methods.toProfileJSON = function () {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    department: this.department,
    phoneNumber: this.phoneNumber,
    studentID: this.studentID,
    role: this.role,
    status: this.status,
    isVerified: this.isVerified,
    rating: this.rating,
    totalReviews: this.totalReviews,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model("User", userSchema);
