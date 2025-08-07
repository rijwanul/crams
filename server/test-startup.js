// Quick server test
console.log("Testing server startup...");

try {
  require("dotenv").config();
  const express = require("express");
  const app = express();
  
  // Test middleware
  app.use(express.json());
  
  // Test route loading
  const registrationRoutes = require("./routes/registrationRoutes");
  console.log("✓ Registration routes loaded");
  
  app.use("/api/registration", registrationRoutes);
  console.log("✓ Routes mounted");
  
  // Test server creation
  const PORT = process.env.PORT || 5000;
  console.log(`✓ Server ready to start on port ${PORT}`);
  console.log("✅ All tests passed - server should start successfully!");
  
} catch (error) {
  console.error("❌ Server startup test failed:");
  console.error(error.message);
  console.error(error.stack);
}
