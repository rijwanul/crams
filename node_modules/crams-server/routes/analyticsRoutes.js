const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const { getAnalytics } = require("../controllers/analyticsController");

router.get("/", auth(["Admin"]), getAnalytics);

module.exports = router;
