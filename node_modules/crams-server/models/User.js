const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: { type: String, required: false }, // Make name optional for existing users
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["Student", "Advisor", "Admin"], required: true },
  studentId: { type: String, unique: true, sparse: true }, // Only for students, sparse allows null values
}, {
  timestamps: true // Add createdAt and updatedAt fields
});

// Remove the pre-save hook to avoid double hashing - we'll hash manually in routes

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
