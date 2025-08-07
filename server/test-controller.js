console.log("Testing registrationController functions...");

try {
  const controller = require("./controllers/registrationController");
  
  console.log("Available functions in controller:");
  console.log("- submitRegistration:", typeof controller.submitRegistration);
  console.log("- getStudentRegistrations:", typeof controller.getStudentRegistrations);
  console.log("- getAllRegistrations:", typeof controller.getAllRegistrations);
  console.log("- approveRegistration:", typeof controller.approveRegistration);
  console.log("- rejectRegistration:", typeof controller.rejectRegistration);
  console.log("- approveCourse:", typeof controller.approveCourse);
  console.log("- rejectCourse:", typeof controller.rejectCourse);
  console.log("- bulkCourseAction:", typeof controller.bulkCourseAction);
  
  console.log("\n✅ Controller loaded successfully!");
  
} catch (error) {
  console.error("❌ Error loading controller:");
  console.error(error.message);
  console.error(error.stack);
}
