const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const { getCourses, createCourse, updateCourse, deleteCourse } = require("../controllers/courseController");

router.get("/", auth(["Student", "Advisor", "Admin"]), getCourses);
router.post("/", auth(["Admin"]), createCourse);
router.put("/:id", auth(["Admin"]), updateCourse);
router.delete("/:id", auth(["Admin"]), deleteCourse);

module.exports = router;
