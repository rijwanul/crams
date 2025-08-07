const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization");
    
    if (!token) {
      return res.status(401).json({ error: "Access denied. No token provided." });
    }
    
    // Remove 'Bearer ' prefix if present
    const cleanToken = token.startsWith("Bearer ") ? token.slice(7) : token;
    
    // Verify the token
    const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.id).select("-password");
    
    if (!user) {
      return res.status(401).json({ error: "Token is valid but user not found." });
    }
    
    // Add user to request object
    req.user = user;
    next();
    
  } catch (error) {
    console.error("Auth middleware error:", error);
    
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token." });
    } else if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired." });
    } else {
      return res.status(401).json({ error: "Token verification failed." });
    }
  }
};

module.exports = auth;
