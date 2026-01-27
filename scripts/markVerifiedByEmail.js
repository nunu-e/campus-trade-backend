const mongoose = require("mongoose");
const User = require("../models/User");
require("dotenv").config({
  path: require("path").resolve(__dirname, "..", ".env"),
});

const emailArg = process.argv.find((a) => a.startsWith("--email="));
if (!emailArg) {
  console.error("Usage: node markVerifiedByEmail.js --email=you@example.com");
  process.exit(2);
}
const email = emailArg.split("=")[1];

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI not set in .env");
    process.exit(2);
  }
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("Connected to MongoDB");
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    console.error("User not found:", email);
    process.exit(1);
  }
  user.isVerified = true;
  user.verificationCode = undefined;
  await user.save();
  console.log("Marked verified:", email);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
