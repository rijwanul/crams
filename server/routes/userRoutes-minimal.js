const express = require("express");
const router = express.Router();

console.log("📝 Creating minimal user routes for testing...");

// Add middleware to log all requests to this router
router.use((req, res, next) => {
  console.log(`🔍 User router middleware: ${req.method} ${req.originalUrl}`);
  next();
});

// Simple test route
router.get("/test", (req, res) => {
  console.log("✅ Test route hit successfully!");
  res.json({ 
    message: "Minimal user routes are working!", 
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    originalUrl: req.originalUrl
  });
});

// Simple registration route
router.post("/register-student", (req, res) => {
  console.log("✅ Registration route hit successfully!");
  console.log("📄 Body:", req.body);
  res.json({ 
    message: "Minimal registration endpoint is working!",
    receivedData: req.body,
    timestamp: new Date().toISOString()
  });
});

console.log("✅ Minimal user routes created successfully");
module.exports = router;
