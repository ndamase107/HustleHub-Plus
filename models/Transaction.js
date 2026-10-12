
const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      unique: true
    },

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },

    status: {
      type: String,
      enum: ["Pending", "Paid", "Refunded"],
      default: "Pending"
    },

    paymentMethod: {
      type: String,
      default: "Simulated"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "Transaction",
  transactionSchema
);
