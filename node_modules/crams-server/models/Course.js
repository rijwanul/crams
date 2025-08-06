const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  limit: { type: Number, required: true },
  prerequisites: [{ type: String }],
  times: [{ day: String, start: String, end: String }],
  enrolled: { type: Number, default: 0 },
  waitlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

module.exports = mongoose.model("Course", courseSchema);
