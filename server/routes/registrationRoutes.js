const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const { submitRegistration, getStudentRegistrations, getAllRegistrations, approveRegistration, rejectRegistration } = require("../controllers/registrationController");

router.post("/", auth(["Student"]), submitRegistration);

// Alternative update route with different path
router.post("/update/:id", auth(["Student"]), (req, res, next) => {
  console.log("Update route hit:", req.params.id, req.user?.id);
  submitRegistration(req, res, next);
});

// Test route to debug PUT requests
router.put("/test", (req, res) => {
  console.log("PUT test route hit");
  res.json({ message: "PUT route works" });
});

router.put("/:id", (req, res, next) => {
  console.log("PUT route hit (no auth):", req.params.id);
  console.log("Request body:", req.body);
  
  // Try to apply auth middleware manually
  const authMiddleware = auth(["Student"]);
  authMiddleware(req, res, (err) => {
    if (err) {
      console.log("Auth error:", err);
      return res.status(401).json({ error: "Authentication failed" });
    }
    console.log("Auth successful, user:", req.user?.id);
    submitRegistration(req, res, next);
  });
});

router.get("/", auth(["Advisor", "Admin"]), getAllRegistrations);
router.get("/student", auth(["Student"]), getStudentRegistrations);
router.post("/approve/:id", auth(["Advisor"]), approveRegistration);
router.post("/reject/:id", auth(["Advisor"]), rejectRegistration);

module.exports = router;
