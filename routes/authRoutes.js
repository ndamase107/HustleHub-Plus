
const express = require("express");
const { body, validationResult } = require("express-validator");
const rateLimit = require("express-rate-limit");

const controller = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts. Please try again later."
  }
});

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  next();
};

// Registration
router.post(
  "/register",
  authLimiter,
  [
    body("name")
      .isString()
      .trim()
      .isLength({ min: 2, max: 100 }),

    body("email")
      .isEmail()
      .normalizeEmail(),

    body("password")
      .isString()
      .isLength({ min: 8, max: 128 }),

    body("role")
      .isIn(["Client", "Freelancer"])
  ],
  validate,
  controller.register
);

// Login
router.post(
  "/login",
  authLimiter,
  [
    body("email")
      .isEmail()
      .normalizeEmail(),

    body("password")
      .isString()
      .notEmpty()
  ],
  validate,
  controller.login
);

// Protected user profile
router.get(
  "/me",
  authMiddleware,
  controller.getProfile
);

module.exports = router;
