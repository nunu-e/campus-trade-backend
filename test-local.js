// test-local.js
const mongoose = require("mongoose");
const User = require("./models/User");

async function testLocal() {
  try {
    // Connect to local MongoDB
    await mongoose.connect("mongodb://localhost:27017/campustrade-test");
    console.log("Connected to MongoDB");

    // Test User model
    const testUser = new User({
      name: "Test User",
      email: "test@aau.edu.et",
      password: "Test1234",
      department: "Computer Science",
      studentID: "UGR/1234/16",
    });

    await testUser.save();
    console.log("User saved successfully:", testUser._id);

    // Clean up
    await User.deleteOne({ email: "test@aau.edu.et" });
    console.log("Test user cleaned up");

    process.exit(0);
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
}

testLocal();
