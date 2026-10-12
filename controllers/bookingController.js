
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Gig = require("../models/Gig");
const Transaction = require("../models/Transaction");

const validId = (id) => mongoose.isValidObjectId(id);

exports.createBooking = async (req, res, next) => {
  try {
    const { gigId } = req.body;

    if (!validId(gigId)) {
      return res.status(400).json({ message: "Valid gigId required" });
    }

    const gig = await Gig.findOne({
      _id: gigId,
      status: "Active"
    });

    if (!gig) {
      return res.status(404).json({ message: "Active gig not found" });
    }

    const booking = await Booking.create({
      gig: gig._id,
      client: req.user.id,
      freelancer: gig.freelancer,
      amount: gig.price,
      status: "Pending"
    });

    res.status(201).json({ success: true, booking });
  } catch (error) {
    next(error);
  }
};

exports.myBookings = async (req, res, next) => {
  try {
    const filter = req.user.role === "Client"
      ? { client: req.user.id }
      : { freelancer: req.user.id };

    const bookings = await Booking.find(filter)
      .populate("gig", "title category price")
      .populate("client", "name")
      .populate("freelancer", "name")
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (error) {
    next(error);
  }
};

exports.acceptBooking = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({ message: "Invalid booking ID" });
    }

    const booking = await Booking.findOneAndUpdate(
      {
        _id: req.params.id,
        freelancer: req.user.id,
        status: "Pending"
      },
      { $set: { status: "Accepted" } },
      { new: true }
    );

    if (!booking) {
      return res.status(409).json({
        message: "Booking unavailable or cannot be accepted"
      });
    }

    res.json({ success: true, booking });
  } catch (error) {
    next(error);
  }
};

exports.completeBooking = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({ message: "Invalid booking ID" });
    }

    const payment = await Transaction.findOne({
      booking: req.params.id,
      status: "Paid"
    });

    if (!payment) {
      return res.status(409).json({
        message: "Payment must be recorded before completion"
      });
    }

    const booking = await Booking.findOneAndUpdate(
      {
        _id: req.params.id,
        freelancer: req.user.id,
        status: "Accepted"
      },
      { $set: { status: "Completed" } },
      { new: true }
    );

    if (!booking) {
      return res.status(409).json({
        message: "Booking unavailable or cannot be completed"
      });
    }

    res.json({ success: true, booking });
  } catch (error) {
    next(error);
  }
};

exports.cancelBooking = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({ message: "Invalid booking ID" });
    }

    // Only pending, unpaid bookings can be cancelled.
    const booking = await Booking.findOneAndUpdate(
      {
        _id: req.params.id,
        client: req.user.id,
        status: "Pending"
      },
      { $set: { status: "Cancelled" } },
      { new: true }
    );

    if (!booking) {
      return res.status(409).json({
        message: "Only your pending bookings can be cancelled"
      });
    }

    res.json({ success: true, booking });
  } catch (error) {
    next(error);
  }
};
