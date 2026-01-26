#!/bin/bash

echo "🚀 Deploying CampusTrade Fix..."

cd campus-trade-backend

echo "1. Checking files..."
ls -la models/ | grep User.js
ls -la controllers/ | grep authController.js
ls -la routes/ | grep authRoutes.js
ls -la middleware/ | grep authMiddleware.js

echo "2. Pushing to GitHub..."
git add .
git commit -m "Fix route loading and middleware"
git push origin main

echo "✅ Fix deployed! Waiting for Render..."
echo "Check logs at: https://dashboard.render.com/web/campus-trade-backend/logs"