const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const auth = require("../middleware/auth");
const router = express.Router();

// Register new student
router.post("/register-student", async (req, res) => {
  try {
    const { name, email, studentId, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { studentId }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        error: "User with this email or student ID already exists" 
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new student
    const user = new User({
      name,
      email,
      studentId,
      password: hashedPassword,
      role: "Student"
    });
    
    await user.save();
    
    res.status(201).json({ 
      message: "Student registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        studentId: user.studentId,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Failed to register student" });
  }
});

// Get all students (for admin/advisor)
router.get("/students", auth, async (req, res) => {
  try {
    if (req.user.role !== "Admin" && req.user.role !== "Advisor") {
      return res.status(403).json({ error: "Access denied" });
    }
    
    const students = await User.find({ role: "Student" })
      .select("-password")
      .sort({ name: 1 });
    
    res.json(students);
  } catch (error) {
    console.error("Get students error:", error);
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

// Get all advisors (for admin)
router.get("/advisors", auth, async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ error: "Access denied" });
    }
    
    const advisors = await User.find({ role: "Advisor" })
      .select("-password")
      .sort({ name: 1 });
    
    res.json(advisors);
  } catch (error) {
    console.error("Get advisors error:", error);
    res.status(500).json({ error: "Failed to fetch advisors" });
  }
});

// Create new user (admin only)
router.post("/create", auth, async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ error: "Access denied" });
    }
    
    const { name, email, password, role, studentId } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User with this email already exists" });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const userData = {
      name,
      email,
      password: hashedPassword,
      role
    };
    
    // Add studentId only for students
    if (role === "Student" && studentId) {
      userData.studentId = studentId;
    }
    
    const user = new User(userData);
    await user.save();
    
    res.status(201).json({ 
      message: "User created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId
      }
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// Update user password (admin only)
router.put("/:id/password", auth, async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ error: "Access denied" });
    }
    
    const { password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await User.findByIdAndUpdate(req.params.id, { password: hashedPassword });
    
    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Update password error:", error);
    res.status(500).json({ error: "Failed to update password" });
  }
});

// Delete user (admin only)
router.delete("/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ error: "Access denied" });
    }
    
    await User.findByIdAndDelete(req.params.id);
    
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

module.exports = router;
