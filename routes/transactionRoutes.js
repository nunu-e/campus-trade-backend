const express = require("express");
const router = express.Router();
const { protect, verified } = require("../middleware/authMiddleware");
const {
  createTransaction,
  getTransactionById,
  getUserTransactions,
  updateTransactionStatus,
  cancelTransaction,
  completeTransaction,
} = require("../controllers/transactionController");

router.route("/").post(protect, verified, createTransaction);

router.get("/my-transactions", protect, verified, getUserTransactions);
router.get("/:id", protect, verified, getTransactionById);
router.put("/:id/status", protect, verified, updateTransactionStatus);
router.put("/:id/cancel", protect, verified, cancelTransaction);
router.put("/:id/complete", protect, verified, completeTransaction);

module.exports = router;
