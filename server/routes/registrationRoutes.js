const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const { submitRegistration, getStudentRegistrations, getAllRegistrations, approveRegistration, rejectRegistration } = require("../controllers/registrationController");

router.post("/", auth(["Student"]), submitRegistration);
router.get("/", auth(["Advisor", "Admin"]), getAllRegistrations);
router.get("/student", auth(["Student"]), getStudentRegistrations);
router.post("/approve/:id", auth(["Advisor"]), approveRegistration);
router.post("/reject/:id", auth(["Advisor"]), rejectRegistration);

module.exports = router;
