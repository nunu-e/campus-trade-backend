const express = require("express");
const router = express.Router();

// Test CORS and connectivity
router.get("/cors-test", (req, res) => {
  res.json({
    success: true,
    message: "CORS is working!",
    headers: {
      origin: req.headers.origin,
      "access-control-allow-origin": req.headers["access-control-allow-origin"],
    },
    timestamp: new Date().toISOString(),
  });
});

// Test database
router.get("/db-test", async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const dbState = mongoose.connection.readyState;
    const states = ["disconnected", "connected", "connecting", "disconnecting"];

    res.json({
      success: true,
      database: {
        state: states[dbState],
        readyState: dbState,
        name: mongoose.connection.name,
        host: mongoose.connection.host,
        models: Object.keys(mongoose.models),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Test registration endpoint
router.post("/register-test", async (req, res) => {
  try {
    // Simulate registration
    const { email, name } = req.body;

    if (!email || !name) {
      return res.status(400).json({
        success: false,
        message: "Email and name are required",
      });
    }

    res.json({
      success: true,
      message: "Registration test successful",
      data: {
        email,
        name,
        testId: Date.now(),
        simulated: true,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
