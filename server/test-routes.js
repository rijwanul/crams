const express = require("express");
const app = express();

// Simple test to check if userRoutes can be loaded
try {
  console.log("Testing userRoutes loading...");
  const userRoutes = require("./routes/userRoutes");
  console.log("✓ userRoutes loaded successfully");
  
  // Check if it's a valid router
  if (userRoutes && typeof userRoutes === 'function') {
    console.log("✓ userRoutes is a valid Express router");
  } else {
    console.log("✗ userRoutes is not a valid Express router");
  }
  
  // Try to use it
  app.use("/api/users", userRoutes);
  console.log("✓ userRoutes attached to app successfully");
  
} catch (error) {
  console.error("✗ Error loading userRoutes:", error.message);
  console.error("Full error:", error);
}

console.log("Test completed");
