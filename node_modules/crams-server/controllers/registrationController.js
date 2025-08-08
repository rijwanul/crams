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
    const regs = await Registration.find().populate("student", "_id email name").populate("courses.course");
    console.log("📋 Fetched registrations with populated student data");
    res.json(regs);
  } catch (err) {
    console.error("❌ Error fetching registrations:", err);
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

// New: Individual course approval
exports.approveCourse = async (req, res) => {
  try {
    console.log("=== APPROVE COURSE CONTROLLER ===");
    const { registrationId, courseId } = req.params;
    const { feedback } = req.body;
    
    console.log("Registration ID:", registrationId);
    console.log("Course ID:", courseId);
    console.log("Feedback:", feedback);
    console.log("User:", req.user?.id, req.user?.role);
    
    const registration = await Registration.findById(registrationId);
    console.log("Registration found:", !!registration);
    
    if (!registration) {
      console.log("❌ Registration not found");
      return res.status(404).json({ error: "Registration not found" });
    }
    
    console.log("Registration courses:", registration.courses.length);
    console.log("Looking for course ID:", courseId);
    registration.courses.forEach((c, index) => {
      console.log(`Course ${index}: ${c.course.toString()} (looking for ${courseId})`);
    });
    
    const courseEntry = registration.courses.find(c => c.course.toString() === courseId);
    console.log("Course entry found:", !!courseEntry);
    
    if (!courseEntry) {
      console.log("❌ Course not found in registration");
      return res.status(404).json({ error: "Course not found in registration" });
    }
    
    console.log("Current course status:", courseEntry.status);
    courseEntry.status = "approved";
    courseEntry.feedback = feedback || "";
    console.log("New course status:", courseEntry.status);
    
    await registration.save();
    console.log("✅ Registration saved");
    
    // Populate the response
    await registration.populate([
      { path: "student", select: "email name" },
      { path: "courses.course" }
    ]);
    
    console.log("✅ Course approved successfully");
    res.json(registration);
  } catch (err) {
    console.error("❌ Course approval error:", err);
    res.status(400).json({ error: err.message });
  }
};

// New: Individual course rejection
exports.rejectCourse = async (req, res) => {
  try {
    console.log("=== REJECT COURSE CONTROLLER ===");
    const { registrationId, courseId } = req.params;
    const { feedback } = req.body;
    
    console.log("Registration ID:", registrationId);
    console.log("Course ID:", courseId);
    console.log("Feedback:", feedback);
    console.log("User:", req.user?.id, req.user?.role);
    
    const registration = await Registration.findById(registrationId);
    console.log("Registration found:", !!registration);
    
    if (!registration) {
      console.log("❌ Registration not found");
      return res.status(404).json({ error: "Registration not found" });
    }
    
    const courseEntry = registration.courses.find(c => c.course.toString() === courseId);
    console.log("Course entry found:", !!courseEntry);
    
    if (!courseEntry) {
      console.log("❌ Course not found in registration");
      return res.status(404).json({ error: "Course not found in registration" });
    }
    
    courseEntry.status = "rejected";
    courseEntry.feedback = feedback || "Course rejected by advisor";
    
    await registration.save();
    console.log("✅ Registration saved");
    
    // Populate the response
    await registration.populate([
      { path: "student", select: "email name" },
      { path: "courses.course" }
    ]);
    
    console.log("✅ Course rejected successfully");
    res.json(registration);
  } catch (err) {
    console.error("❌ Course rejection error:", err);
    res.status(400).json({ error: err.message });
  }
};

// New: Bulk course actions
exports.bulkCourseAction = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { courseIds, action, feedback } = req.body;
    
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: "Invalid action. Must be 'approve' or 'reject'" });
    }
    
    const registration = await Registration.findById(registrationId);
    if (!registration) {
      return res.status(404).json({ error: "Registration not found" });
    }
    
    // Update selected courses
    registration.courses.forEach(courseEntry => {
      if (courseIds.includes(courseEntry.course.toString())) {
        courseEntry.status = action === 'approve' ? 'approved' : 'rejected';
        courseEntry.feedback = feedback || (action === 'approve' ? 'Approved by advisor' : 'Rejected by advisor');
      }
    });
    
    await registration.save();
    
    // Populate the response
    await registration.populate([
      { path: "student", select: "email name" },
      { path: "courses.course" }
    ]);
    
    res.json(registration);
  } catch (err) {
    console.error("Bulk course action error:", err);
    res.status(400).json({ error: err.message });
  }
};
