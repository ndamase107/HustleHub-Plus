const rateLimit = require("express-rate-limit");

const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many booking requests. Please try again in 15 minutes."
  }
});
const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const authorize = require("../middleware/authorize");
const bookings = require("../controllers/bookingController");

router.use(auth);

router.get(
  "/mine",
  authorize("Client", "Freelancer"),
  bookings.myBookings
);

router.post(
  "/",
  authorize("Client"),
  bookingLimiter,
  bookings.createBooking
);

router.patch(
  "/:id/accept",
  authorize("Freelancer"),
  bookings.acceptBooking
);



router.patch(
  "/:id/complete",
  authorize("Freelancer"),
  bookings.completeBooking
);

router.patch(
  "/:id/cancel",
  authorize("Client"),
  bookings.cancelBooking
);

module.exports = router;
