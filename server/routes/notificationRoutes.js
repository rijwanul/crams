const express = require("express");
const Notification = require("../models/Notification");
const auth = require("../middleware/auth");
const router = express.Router();

// Get notifications for the current user
router.get("/", auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50); // Limit to 50 most recent notifications
    
    res.json(notifications);
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// Mark notification as read
router.put("/:id/read", auth, async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { read: true }
    );
    
    res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Mark notification read error:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

// Mark all notifications as read
router.put("/mark-all-read", auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, read: false },
      { read: true }
    );
    
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Mark all notifications read error:", error);
    res.status(500).json({ error: "Failed to mark all notifications as read" });
  }
});

// Send notification to users (admin/advisor only)
router.post("/send", auth, async (req, res) => {
  try {
    if (req.user.role !== "Admin" && req.user.role !== "Advisor") {
      return res.status(403).json({ error: "Access denied" });
    }
    
    const { recipients, title, message } = req.body;
    
    // Create notifications for all recipients
    const notifications = recipients.map(recipientId => ({
      recipient: recipientId,
      sender: req.user.id,
      title,
      message,
      read: false
    }));
    
    await Notification.insertMany(notifications);
    
    res.json({ 
      message: `Notification sent to ${recipients.length} user(s)`,
      count: recipients.length 
    });
  } catch (error) {
    console.error("Send notification error:", error);
    res.status(500).json({ error: "Failed to send notification" });
  }
});

// Delete notification
router.delete("/:id", auth, async (req, res) => {
  try {
    await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user.id
    });
    
    res.json({ message: "Notification deleted" });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({ error: "Failed to delete notification" });
  }
});

module.exports = router;
