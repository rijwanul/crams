console.log("Testing userRoutes.js loading...");

try {
  console.log("1. Testing basic requires...");
  const express = require("express");
  console.log("✓ Express loaded");
  
  const bcrypt = require("bcryptjs");
  console.log("✓ bcryptjs loaded");
  
  const User = require("./models/User");
  console.log("✓ User model loaded");
  
  const auth = require("./middleware/auth");
  console.log("✓ Auth middleware loaded");
  
  console.log("2. Testing userRoutes loading...");
  const userRoutes = require("./routes/userRoutes");
  console.log("✓ userRoutes loaded successfully");
  console.log("Type:", typeof userRoutes);
  
  console.log("3. Testing router functions...");
  if (userRoutes && userRoutes.stack) {
    console.log("✓ Router has stack property");
    console.log("Routes found:", userRoutes.stack.length);
  } else {
    console.log("⚠ Router missing stack or not a router");
  }
  
  console.log("✅ All tests passed!");
  
} catch (error) {
  console.error("❌ Error during testing:");
  console.error("Error message:", error.message);
  console.error("Error stack:", error.stack);
  
  if (error.message.includes("Cannot find module")) {
    console.error("📝 This is a missing dependency issue");
  } else if (error.message.includes("SyntaxError")) {
    console.error("📝 This is a syntax error in the code");
  } else {
    console.error("📝 This is a runtime error");
  }
}
