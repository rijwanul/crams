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
  app.use("/api/users", require("./routes/userRoutes"));
  console.log("✓ User routes loaded");
} catch (err) {
  console.error("✗ Error loading user routes:", err.message);
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

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
    app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ Server URL: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("✗ MongoDB connection error:", err);
    process.exit(1);
  });
