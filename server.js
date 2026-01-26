const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/database");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(cors());

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to CampusTrade API",
    version: "1.0.0",
    description: "Student-to-Student Marketplace Platform for AAU",
    documentation: "/api-docs (coming soon)",
    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
      listings: "/api/listings",
      transactions: "/api/transactions",
      messages: "/api/messages",
      reviews: "/api/reviews",
      admin: "/api/admin",
      reports: "/api/reports",
    },
  });
});

// Health check route
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    database: "Connected",
    environment: process.env.NODE_ENV || "development",
  });
});

// Mount routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/listings", require("./routes/listingRoutes"));
app.use("/api/transactions", require("./routes/transactionRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/build")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../frontend/build/index.html"));
  });
}

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`=== CampusTrade Backend Server ===`);
  console.log(
    `Server running in ${process.env.NODE_ENV || "development"} mode`,
  );
  console.log(`Server URL: http://localhost:${PORT}`);
  console.log(`API Base URL: http://localhost:${PORT}/api`);
  console.log(`Health Check: http://localhost:${PORT}/health`);
  console.log(
    `MongoDB: ${process.env.MONGO_URI || "mongodb://localhost:27017/campustrade"}`,
  );
  console.log(`===================================`);
});
