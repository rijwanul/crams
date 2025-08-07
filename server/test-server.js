// Direct server startup test
console.log("=== DIRECT SERVER TEST ===");

// Load environment
require("dotenv").config();
console.log("Environment loaded");

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

console.log("Creating Express app...");
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Test server is running!" });
});

console.log("Testing userRoutes loading...");
try {
  const userRoutes = require("./routes/userRoutes");
  console.log("✓ userRoutes loaded");
  
  app.use("/api/users", userRoutes);
  console.log("✓ userRoutes mounted to /api/users");
  
  // Test route listing
  console.log("\nMounted routes:");
  app._router.stack.forEach((middleware, index) => {
    if (middleware.route) {
      console.log(`  ${index}: ${Object.keys(middleware.route.methods).join(',').toUpperCase()} ${middleware.route.path}`);
    } else if (middleware.name === 'router') {
      console.log(`  ${index}: Router mounted at pattern: ${middleware.regexp.source}`);
      if (middleware.handle && middleware.handle.stack) {
        middleware.handle.stack.forEach((route, routeIndex) => {
          if (route.route) {
            const methods = Object.keys(route.route.methods).join(',').toUpperCase();
            console.log(`    ${routeIndex}: ${methods} /api/users${route.route.path}`);
          }
        });
      }
    }
  });
  
} catch (error) {
  console.error("❌ Error loading userRoutes:", error.message);
  console.error(error.stack);
  process.exit(1);
}

// Test MongoDB connection
console.log("\nTesting MongoDB connection...");
mongoose.connect(process.env.MONGODB_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
.then(() => {
  console.log("✓ MongoDB connected");
  
  // Start server
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`✓ Test server running on port ${PORT}`);
    console.log(`✓ Test URL: http://localhost:${PORT}/api/users/test`);
    console.log("\nServer is ready for testing!");
  });
})
.catch((err) => {
  console.error("❌ MongoDB connection failed:", err);
  process.exit(1);
});
