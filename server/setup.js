// Setup script to create sample users and courses
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Course = require("./models/Course");

async function setup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clear existing data
    await User.deleteMany({});
    await Course.deleteMany({});
    console.log("Cleared existing data");

    // Create sample users
    const users = [
      { email: "student1@example.com", password: "password123", role: "Student" },
      { email: "advisor1@example.com", password: "password123", role: "Advisor" },
      { email: "admin1@example.com", password: "password123", role: "Admin" },
    ];

    for (const userData of users) {
      const user = new User(userData);
      await user.save();
    }
    console.log("Created sample users");

    // Create sample courses
    const courses = [
      {
        code: "CS101",
        name: "Introduction to Programming",
        limit: 30,
        prerequisites: [],
        times: [{ day: "Mon", start: "10:00", end: "12:00" }],
        enrolled: 15
      },
      {
        code: "CS201",
        name: "Data Structures",
        limit: 25,
        prerequisites: ["CS101"],
        times: [{ day: "Wed", start: "14:00", end: "16:00" }],
        enrolled: 20
      },
      {
        code: "MATH101",
        name: "Calculus I",
        limit: 40,
        prerequisites: [],
        times: [{ day: "Tue", start: "09:00", end: "11:00" }],
        enrolled: 35
      }
    ];

    for (const courseData of courses) {
      const course = new Course(courseData);
      await course.save();
    }
    console.log("Created sample courses");

    console.log("Setup complete! You can now:");
    console.log("- Login as student1@example.com / password123 (Student)");
    console.log("- Login as advisor1@example.com / password123 (Advisor)");
    console.log("- Login as admin1@example.com / password123 (Admin)");

    process.exit(0);
  } catch (error) {
    console.error("Setup failed:", error);
    process.exit(1);
  }
}

setup();
