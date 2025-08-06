const Registration = require("../models/Registration");
const Course = require("../models/Course");

exports.getAnalytics = async (req, res) => {
  const approved = await Registration.countDocuments({ "courses.status": "approved" });
  const rejected = await Registration.countDocuments({ "courses.status": "rejected" });
  const waitlisted = await Registration.countDocuments({ "courses.status": "waitlisted" });
  const courses = await Course.find();
  res.json({
    approved,
    rejected,
    waitlisted,
    seatUsage: courses.map((c) => ({ code: c.code, enrolled: c.enrolled, limit: c.limit })),
  });
};
