// Simple database connection test
require("dotenv").config();
const mongoose = require("mongoose");

console.log("=== Database Connection Test ===");
console.log("MONGODB_URI:", process.env.MONGODB_URI ? "Set" : "Not set");

if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is not set in environment variables");
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
.then(async () => {
  console.log("✅ Connected to MongoDB successfully");
  
  // Test User model
  try {
    const User = require("./models/User");
    console.log("✅ User model loaded successfully");
    
    // Check existing users
    const userCount = await User.countDocuments();
    console.log(`📊 Current user count: ${userCount}`);
    
    // List all users (without passwords)
    const users = await User.find({}).select("-password");
    console.log("📋 Existing users:");
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.role}) - Name: ${user.name || 'N/A'}`);
    });
    
    mongoose.disconnect();
    console.log("✅ Database test completed successfully");
    
  } catch (error) {
    console.error("❌ Error testing User model:", error);
    mongoose.disconnect();
    process.exit(1);
  }
})
.catch((err) => {
  console.error("❌ MongoDB connection failed:", err);
  process.exit(1);
});
