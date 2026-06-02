const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
      throw new Error("MONGO_URI environment variable is not defined");
    }

    const conn = await mongoose.connect(mongoURI, {
      // These options ensure auto-reconnect is enabled (Mongoose 6+ defaults to true,
      // but explicitly set for clarity)
      autoIndex: true, // Build indexes (disable in production after initial deploy)
      autoCreate: true, // Create collection if it doesn't exist
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    console.error("Retrying in 5 seconds...");
    setTimeout(connectDB, 5000); // Retry after 5 seconds
  }
};

// Monitor connection events
mongoose.connection.on("error", (err) => {
  console.error(`MongoDB connection error: ${err}`);
});

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected. Attempting to reconnect...");
});

mongoose.connection.on("reconnected", () => {
  console.log("MongoDB reconnected.");
});

// Graceful shutdown – close Mongoose connection when app terminates
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("MongoDB connection closed due to app termination");
  process.exit(0);
});

module.exports = connectDB;
