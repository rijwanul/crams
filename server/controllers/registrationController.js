const Registration = require("../models/Registration");
const Course = require("../models/Course");

exports.submitRegistration = async (req, res) => {
  try {
    // TODO: Add conflict checking logic
    const registration = new Registration({ student: req.user.id, courses: req.body.courses });
    await registration.save();
    res.status(201).json(registration);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getStudentRegistrations = async (req, res) => {
  const regs = await Registration.find({ student: req.user.id }).populate("courses.course");
  res.json(regs);
};

exports.approveRegistration = async (req, res) => {
  try {
    const reg = await Registration.findById(req.params.id);
    if (!reg) return res.status(404).json({ error: "Not found" });
    reg.courses.forEach((c) => (c.status = "approved"));
    await reg.save();
    res.json(reg);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.rejectRegistration = async (req, res) => {
  try {
    const reg = await Registration.findById(req.params.id);
    if (!reg) return res.status(404).json({ error: "Not found" });
    reg.courses.forEach((c) => {
      c.status = "rejected";
      c.feedback = req.body.feedback || "";
    });
    await reg.save();
    res.json(reg);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
