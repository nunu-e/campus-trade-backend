const Report = require("../models/Report");
const User = require("../models/User");
const Listing = require("../models/Listing");

// @desc    Create a report
// @route   POST /api/reports
// @access  Private/Verified
const createReport = async (req, res) => {
  try {
    const { reportedUserId, listingId, reason, description } = req.body;

    // Validate at least one target is provided
    if (!reportedUserId && !listingId) {
      return res.status(400).json({
        message: "Must report either a user or a listing",
      });
    }

    // Validate reported user exists if provided
    if (reportedUserId) {
      const reportedUser = await User.findById(reportedUserId);
      if (!reportedUser) {
        return res.status(404).json({ message: "Reported user not found" });
      }
      // Cannot report yourself
      if (reportedUserId === req.user._id.toString()) {
        return res.status(400).json({ message: "Cannot report yourself" });
      }
    }

    // Validate listing exists if provided
    if (listingId) {
      const listing = await Listing.findById(listingId);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
    }

    const report = await Report.create({
      reporterId: req.user._id,
      reportedUserId,
      listingId,
      reason,
      description,
    });

    res.status(201).json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get user's reports
// @route   GET /api/reports
// @access  Private/Verified
const getUserReports = async (req, res) => {
  try {
    const reports = await Report.find({ reporterId: req.user._id })
      .populate("reportedUserId", "name")
      .populate("listingId", "title")
      .sort("-createdAt");

    res.json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get report by ID
// @route   GET /api/reports/:id
// @access  Private/Verified
const getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate("reporterId", "name email")
      .populate("reportedUserId", "name email")
      .populate("listingId", "title sellerId");

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Check authorization
    if (
      report.reporterId._id.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update report status
// @route   PUT /api/reports/:id
// @access  Private/Verified
const updateReportStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const validStatuses = ["Pending", "Under Review", "Resolved", "Rejected"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Only admin can update report status
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    report.status = status;
    if (adminNotes) {
      report.adminNotes = adminNotes;
    }

    if (status === "Resolved" || status === "Rejected") {
      report.resolvedAt = new Date();
      report.resolvedBy = req.user._id;
    }

    await report.save();

    res.json({
      message: `Report ${status.toLowerCase()}`,
      report,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createReport,
  getUserReports,
  getReportById,
  updateReportStatus,
};
