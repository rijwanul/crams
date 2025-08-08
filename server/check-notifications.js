require("dotenv").config();
const mongoose = require("mongoose");
const Notification = require("./models/Notification");

async function checkNotifications() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    console.log("📧 Checking notifications in database...");
    const notifications = await Notification.find({}).populate('recipient sender', 'name email').sort({ createdAt: -1 }).limit(10);
    
    console.log(`Found ${notifications.length} notifications:`);
    notifications.forEach((notif, index) => {
      console.log(`${index + 1}. ${notif.title}`);
      console.log(`   To: ${notif.recipient?.name || 'Unknown'} (${notif.recipient?.email || 'Unknown'})`);
      console.log(`   From: ${notif.sender?.name || 'Unknown'} (${notif.sender?.email || 'Unknown'})`);
      console.log(`   Message: ${notif.message}`);
      console.log(`   Date: ${notif.createdAt}`);
      console.log(`   Read: ${notif.read}`);
      console.log('---');
    });

    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

checkNotifications();
