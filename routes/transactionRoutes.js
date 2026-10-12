
const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const authorize = require("../middleware/authorize");
const transactions = require("../controllers/transactionController");

router.use(auth);

router.get(
  "/mine",
  authorize("Client", "Freelancer"),
  transactions.myTransactions
);

router.get(
  "/earnings",
  authorize("Freelancer"),
  transactions.getEarnings
);

router.post(
  "/pay/:bookingId",
  authorize("Client"),
  transactions.simulatePayment
);

module.exports = router;
