const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.signup = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const user = new User({ email, password, role });
    await user.save();
    res.status(201).json({ message: "Signup successful" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    console.log("Login attempt:", req.body);
    const { email, password, role } = req.body;
    
    console.log("Searching for user with email:", email);
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log("User not found with email:", email);
      return res.status(401).json({ error: "Invalid credentials - user not found" });
    }
    
    console.log("User found:", { id: user._id, email: user.email, role: user.role, name: user.name });
    
    console.log("Comparing password...");
    const isPasswordValid = await user.comparePassword(password);
    console.log("Password valid:", isPasswordValid);
    
    if (!isPasswordValid) {
      console.log("Password comparison failed");
      return res.status(401).json({ error: "Invalid credentials - wrong password" });
    }
    
    // Optional: Check if role matches (if role is provided in request)
    if (role && user.role !== role) {
      console.log("Role mismatch. Expected:", role, "Found:", user.role);
      return res.status(401).json({ error: "Invalid credentials - role mismatch" });
    }
    
    console.log("Generating token...");
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });
    
    console.log("Login successful for user:", user.email);
    res.json({ 
      token, 
      role: user.role,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(400).json({ error: err.message });
  }
};
