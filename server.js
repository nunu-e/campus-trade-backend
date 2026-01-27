const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const connectDB = require("./config/database");

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

// 1. CORS Middleware - FIRST
const corsOptions = {
  origin: [
    "https://campus-trade-frontend.netlify.app",
    "http://localhost:3000",
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// 2. Body Parser Middleware - SECOND
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Request Logger (for debugging)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  console.log("Origin:", req.headers.origin);
  console.log("User-Agent:", req.headers["user-agent"]?.substring(0, 50));
  next();
});

// 4. Health Check - BEFORE other routes
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 5. Root route
app.get("/", (req, res) => {
  res.json({
    message: "CampusTrade API v1.0",
    endpoints: {
      auth: "/api/auth/*",
      listings: "/api/listings/*",
      messages: "/api/messages/*",
      admin: "/api/admin/*",
      health: "/api/health",
    },
  });
});

// 6. Import ALL routes first
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const listingRoutes = require("./routes/listingRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const messageRoutes = require("./routes/messageRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const adminRoutes = require("./routes/adminRoutes");
const reportRoutes = require("./routes/reportRoutes");

// 7. Mount ALL routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reports", reportRoutes);

// 8. 404 Handler - AFTER all routes
app.use("*", (req, res) => {
  console.log(`404: Route not found: ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: "Route not found",
    message: `The route ${req.originalUrl} does not exist`,
    availableRoutes: [
      "POST /api/auth/register",
      "POST /api/auth/login",
      "GET  /api/auth/profile",
      "GET  /api/listings",
      "POST /api/listings",
      "GET  /api/health",
    ],
  });
});

// 9. Error Handler - LAST
app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack);
  res.status(500).json({
    success: false,
    error: "Internal Server Error",
    message:
      process.env.NODE_ENV === "production"
        ? "Something went wrong"
        : err.message,
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `🔗 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:3000"}`,
  );
});
