const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const connectDB = require("./config/database");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
// Load env vars
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ["MONGO_URI", "JWT_SECRET"];
requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    console.error(` ERROR: ${envVar} is not defined in environment variables`);
    process.exit(1);
  }
});

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);
// Security headers
app.use(helmet());

// Remove X-Powered-By (helmet already does it, but explicit for clarity)
app.disable("x-powered-by");
// 1. CORS Middleware
const FRONTEND_URL =
  process.env.FRONTEND_URL || "https://campus-trade-frontend.netlify.app";
const allowedOrigins = [FRONTEND_URL, "http://localhost:3000"];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

app.use(cors(corsOptions));

// Ensure Access-Control-Allow-Credentials header present on all responses
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

// 2. Body Parser Middleware
// Increase limit for image uploads (base64 encoded images)
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.use(mongoSanitize());

// 3. Request Logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// 4. Health Check
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

// 6. Import routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const listingRoutes = require("./routes/listingRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const messageRoutes = require("./routes/messageRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const adminRoutes = require("./routes/adminRoutes");
const reportRoutes = require("./routes/reportRoutes");

// 7. Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reports", reportRoutes);

// 8. 404 Handler
app.use(notFound);

// 9. Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Initialize WebSocket support (if socket module available)
try {
  console.log("Initializing WebSocket module...");
  const setupWebSocket = require("./socket/socket");
  setupWebSocket(server);
  console.log("WebSocket module initialized successfully");
} catch (err) {
  console.error("WebSocket setup failed to initialize:", err);
}

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 Frontend URL: ${FRONTEND_URL}`);
});
