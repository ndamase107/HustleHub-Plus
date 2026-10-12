
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Transaction = require("../models/Transaction");

exports.simulatePayment = async (req, res, next) => {
  try {
    const bookingId = req.params.bookingId;

    if (!mongoose.isValidObjectId(bookingId)) {
      return res.status(400).json({
        message: "Invalid booking ID"
      });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      client: req.user.id,
      status: "Accepted"
    });

    if (!booking) {
      return res.status(409).json({
        message: "Only your accepted bookings can be paid"
      });
    }

    // Unique booking index prevents duplicate transactions.
    const transaction = await Transaction.create({
      booking: booking._id,
      client: booking.client,
      freelancer: booking.freelancer,
      amount: booking.amount,
      status: "Paid",
      paymentMethod: "Simulated"
    });

    res.status(201).json({
      success: true,
      message: "Simulated payment recorded",
      transaction
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Payment already recorded for this booking"
      });
    }

    next(error);
  }
};

exports.myTransactions = async (req, res, next) => {
  try {
    const filter = req.user.role === "Client"
      ? { client: req.user.id }
      : { freelancer: req.user.id };

    const transactions = await Transaction.find(filter)
      .populate("booking", "status amount")
      .sort({ createdAt: -1 });

    res.json({ success: true, transactions });
  } catch (error) {
    next(error);
  }
};

exports.getEarnings = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({
      freelancer: req.user.id,
      status: "Paid"
    }).populate("booking", "status");

    const completed = transactions.filter(
      (transaction) =>
        transaction.booking?.status === "Completed"
    );

    const totalEarnings = completed.reduce(
      (sum, transaction) => sum + transaction.amount,
      0
    );

    res.json({
      success: true,
      currency: "ZAR",
      completedJobs: completed.length,
      totalEarnings,
      note: "Simulated earnings only"
    });
  } catch (error) {
    next(error);
  }
};
