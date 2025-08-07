const Registration = require("../models/Registration");
const Course = require("../models/Course");

exports.submitRegistration = async (req, res) => {
  try {
    const isUpdate = req.params.id; // Check if this is an update operation
    console.log("Registration submission:", { isUpdate, userId: req.user.id, courses: req.body.courses });
    
    if (isUpdate) {
      // Update existing registration
      const existingRegistration = await Registration.findOne({
        _id: req.params.id,
        student: req.user.id
      });
      
      if (!existingRegistration) {
        console.log("Registration not found for update:", req.params.id, req.user.id);
        return res.status(404).json({ error: "Registration not found" });
      }
      
      // Update the registration with new courses and reset status to pending
      existingRegistration.courses = req.body.courses.map(course => ({
        course: course.course,
        status: "pending",
        feedback: ""
      }));
      // Remove the line that sets status on the registration level since it doesn't exist in the model
      existingRegistration.updatedAt = new Date();
      
      await existingRegistration.save();
      console.log("Registration updated successfully:", existingRegistration._id);
      res.json(existingRegistration);
    } else {
      // Create new registration
      // Check if student already has a registration
      const existingRegistration = await Registration.findOne({ student: req.user.id });
      if (existingRegistration) {
        return res.status(400).json({ 
          error: "You already have a registration. Please edit your existing registration instead." 
        });
      }
      
      const registration = new Registration({ 
        student: req.user.id, 
        courses: req.body.courses.map(course => ({
          course: course.course,
          status: "pending"
        }))
      });
      await registration.save();
      console.log("New registration created:", registration._id);
      res.status(201).json(registration);
    }
  } catch (err) {
    console.error("Registration submission error:", err);
    res.status(400).json({ error: err.message });
  }
};

exports.getStudentRegistrations = async (req, res) => {
  try {
    const regs = await Registration.find({ student: req.user.id }).populate("courses.course");
    res.json(regs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllRegistrations = async (req, res) => {
  try {
    const regs = await Registration.find().populate("student", "email").populate("courses.course");
    res.json(regs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
