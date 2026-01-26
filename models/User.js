const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    validate: {
      validator: function (v) {
        return /^[a-zA-Z0-9._%+-]+@aau\.edu\.et$/.test(v);
      },
      message: "Please use a valid AAU email address (@aau.edu.et)",
    },
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: 6,
  },
  phoneNumber: {
    type: String,
    validate: {
      validator: function (v) {
        return /^(\+251|0)[79]\d{8}$/.test(v);
      },
      message: "Please enter a valid Ethiopian phone number",
    },
  },
  department: {
    type: String,
    required: [true, "Department is required"],
  },
  studentID: {
    type: String,
    required: [true, "Student ID is required"],
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  totalReviews: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ["active", "suspended", "banned"],
    default: "active",
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  verificationCode: String,
  isVerified: {
    type: Boolean,
    default: false,
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
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Update updatedAt on save
userSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
