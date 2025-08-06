const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  courses: [{
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    status: { type: String, enum: ["pending", "approved", "rejected", "waitlisted"], default: "pending" },
    feedback: String,
  }],
  submittedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Registration", registrationSchema);
