require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();

console.log("Starting CRAMS Server...");
console.log("Environment variables:");
console.log("- MONGODB_URI:", process.env.MONGODB_URI ? "Set" : "Not set");
console.log("- JWT_SECRET:", process.env.JWT_SECRET ? "Set" : "Not set");
console.log("- PORT:", process.env.PORT || "5000 (default)");

// Middleware
app.use(cors());
app.use(express.json());

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log("Headers:", req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log("Body:", req.body);
  }
  next();
});

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ message: "CRAMS Server is running!" });
});

console.log("Loading routes...");

// Routes
try {
  app.use("/api/auth", require("./routes/authRoutes"));
  console.log("✓ Auth routes loaded");
} catch (err) {
  console.error("✗ Error loading auth routes:", err.message);
}

try {
  app.use("/api/courses", require("./routes/courseRoutes"));
  console.log("✓ Course routes loaded");
} catch (err) {
  console.error("✗ Error loading course routes:", err.message);
}

try {
  app.use("/api/registration", require("./routes/registrationRoutes"));
  console.log("✓ Registration routes loaded");
} catch (err) {
  console.error("✗ Error loading registration routes:", err.message);
}

try {
  app.use("/api/analytics", require("./routes/analyticsRoutes"));
  console.log("✓ Analytics routes loaded");
} catch (err) {
  console.error("✗ Error loading analytics routes:", err.message);
}

try {
  app.use("/api/notifications", require("./routes/notificationRoutes"));
  console.log("✓ Notification routes loaded");
} catch (err) {
  console.error("✗ Error loading notification routes:", err.message);
}

try {
  // Switch back to full user routes with database operations
  console.log("📂 Loading full user routes...");
  const userRoutes = require("./routes/userRoutes");
  console.log("📋 Routes loaded, attaching to /api/users...");
  app.use("/api/users", userRoutes);
  console.log("✅ Full user routes loaded and attached successfully");
} catch (err) {
  console.error("❌ Error loading full user routes:", err.message);
  console.error("Full error:", err);
}

// Connect to MongoDB
const PORT = process.env.PORT || 5000;

if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI environment variable is not set");
  process.exit(1);
}

console.log("Connecting to MongoDB...");
mongoose.connect(process.env.MONGODB_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
  .then(() => {
    console.log("✓ Connected to MongoDB");
    
    // Error handling middleware (after routes)
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({ message: "Something went wrong!" });
    });

    // Generic 404 handler (should be last)
    app.use("*", (req, res) => {
      console.log(`❌ Unhandled route: ${req.method} ${req.originalUrl}`);
      res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
    });
    
    app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ Server URL: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("✗ MongoDB connection error:", err);
    process.exit(1);
  });
