require("dotenv").config({ path: __dirname + "/../.env" });
const mongoose = require("mongoose");
const User = require("../models/User");

const email = process.argv[2] || "smoke+user@example.com";

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const user = await User.findOne({ email });
    if (!user) {
      console.error("User not found:", email);
      process.exit(1);
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    await user.save();

    console.log("Marked verified:", user.email);
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message || err);
    process.exit(1);
  }
})();
