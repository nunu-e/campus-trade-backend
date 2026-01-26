const express = require("express");
const router = express.Router();
const { protect, verified } = require("../middleware/authMiddleware");
const {
  createReport,
  getUserReports,
  getReportById,
  updateReportStatus,
} = require("../controllers/reportController");

router.use(protect);

router.route("/").post(verified, createReport).get(verified, getUserReports);

router
  .route("/:id")
  .get(verified, getReportById)
  .put(verified, updateReportStatus);

module.exports = router;
