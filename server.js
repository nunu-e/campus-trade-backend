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

// FIXED CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      "https://campus-trade-frontend.netlify.app",
      "http://localhost:3000",
    ];

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.log("CORS blocked for origin:", origin);
      return callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options("*", cors(corsOptions));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: "connected",
    cors: "enabled",
    allowedOrigins: [
      "https://campus-trade-frontend.netlify.app",
      "http://localhost:3000",
    ],
  });
});

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "CampusTrade API",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      listings: "/api/listings",
      messages: "/api/messages",
      admin: "/api/admin",
      health: "/api/health",
    },
    documentation: "Add /api-docs endpoint for documentation",
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

// Add test route for debugging
app.use("/api/test", require("./routes/testRoutes"));

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: [
      "/api/auth/register",
      "/api/auth/login",
      "/api/listings",
      "/api/health",
    ],
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);

  // Handle CORS errors
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      success: false,
      error: "CORS Error",
      message: "Origin not allowed",
    });
  }

  res.status(500).json({
    success: false,
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`,
  );
  console.log(
    `CORS enabled for: ${process.env.FRONTEND_URL || "http://localhost:3000"}`,
  );
});
