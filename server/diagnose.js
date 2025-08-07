console.log("=== CRAMS Route Diagnostic Tool ===");
console.log("Testing route loading and basic functionality...\n");

// Test 1: Check if express is working
console.log("Test 1: Testing Express...");
try {
  const express = require("express");
  console.log("✓ Express loaded successfully");
} catch (e) {
  console.log("✗ Express failed:", e.message);
  process.exit(1);
}

// Test 2: Check if we can create a basic router
console.log("\nTest 2: Testing basic router creation...");
try {
  const express = require("express");
  const router = express.Router();
  router.get("/test", (req, res) => res.json({test: true}));
  console.log("✓ Basic router created successfully");
} catch (e) {
  console.log("✗ Basic router failed:", e.message);
  process.exit(1);
}

// Test 3: Try loading the minimal routes
console.log("\nTest 3: Testing minimal routes...");
try {
  const minimalRoutes = require("./routes/userRoutes-minimal");
  console.log("✓ Minimal routes loaded successfully");
  console.log("Type:", typeof minimalRoutes);
} catch (e) {
  console.log("✗ Minimal routes failed:", e.message);
}

// Test 4: Try loading the full routes
console.log("\nTest 4: Testing full routes...");
try {
  const fullRoutes = require("./routes/userRoutes");
  console.log("✓ Full routes loaded successfully");
  console.log("Type:", typeof fullRoutes);
} catch (e) {
  console.log("✗ Full routes failed:", e.message);
  console.log("Error details:", e.stack);
}

// Test 5: Check dependencies
console.log("\nTest 5: Testing dependencies...");
const deps = ["bcryptjs", "mongoose"];
deps.forEach(dep => {
  try {
    require(dep);
    console.log(`✓ ${dep} loaded successfully`);
  } catch (e) {
    console.log(`✗ ${dep} failed:`, e.message);
  }
});

// Test 6: Check models
console.log("\nTest 6: Testing User model...");
try {
  const User = require("./models/User");
  console.log("✓ User model loaded successfully");
} catch (e) {
  console.log("✗ User model failed:", e.message);
  console.log("Error details:", e.stack);
}

console.log("\n=== Diagnostic Complete ===");
console.log("If all tests pass, the issue is likely with Express app configuration.");
console.log("If any tests fail, that's where the problem is.");
