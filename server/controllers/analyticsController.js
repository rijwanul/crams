const Registration = require("../models/Registration");
const Course = require("../models/Course");

exports.getAnalytics = async (req, res) => {
  try {
    console.log("📊 Analytics endpoint called");

    // Get total registrations
    const totalRegistrations = await Registration.countDocuments();

    // Get pending registrations (at least one course is pending)
    const pendingRegistrations = await Registration.countDocuments({
      "courses.status": "pending"
    });

    // Get approved courses count
    const approvedCoursesResult = await Registration.aggregate([
      { $unwind: "$courses" },
      { $match: { "courses.status": "approved" } },
      { $count: "approved" }
    ]);
    const approvedCourses = approvedCoursesResult.length > 0 ? approvedCoursesResult[0].approved : 0;

    // Get rejected courses count
    const rejectedCoursesResult = await Registration.aggregate([
      { $unwind: "$courses" },
      { $match: { "courses.status": "rejected" } },
      { $count: "rejected" }
    ]);
    const rejectedCourses = rejectedCoursesResult.length > 0 ? rejectedCoursesResult[0].rejected : 0;

    // Get waitlisted courses count
    const waitlistedCoursesResult = await Registration.aggregate([
      { $unwind: "$courses" },
      { $match: { "courses.status": "waitlisted" } },
      { $count: "waitlisted" }
    ]);
    const waitlistedCourses = waitlistedCoursesResult.length > 0 ? waitlistedCoursesResult[0].waitlisted : 0;

    // Get total courses
    const totalCoursesResult = await Registration.aggregate([
      { $unwind: "$courses" },
      { $count: "total" }
    ]);
    const totalCourses = totalCoursesResult.length > 0 ? totalCoursesResult[0].total : 0;

    // Get course seat usage
    const courses = await Course.find();
    const seatUsage = courses.map((c) => ({ 
      code: c.code, 
      name: c.name,
      enrolled: c.enrolled, 
      limit: c.limit,
      utilization: Math.round((c.enrolled / c.limit) * 100)
    }));

    const analytics = {
      totalRegistrations,
      pendingRegistrations,
      approvedCourses,
      rejectedCourses,
      waitlistedCourses,
      totalCourses,
      completedRegistrations: totalRegistrations - pendingRegistrations,
      seatUsage
    };

    console.log("📊 Analytics data:", analytics);
    res.json(analytics);
  } catch (error) {
    console.error("❌ Error fetching analytics:", error);
    res.status(500).json({ message: "Error fetching analytics", error: error.message });
  }
};
