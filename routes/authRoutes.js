const express = require("express");
const { body, validationResult } = require("express-validator");
const controller = require("../controllers/authController");

const router = express.Router();

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

router.post(
    "/register",
    [
        body("name").trim().notEmpty(),
        body("email").isEmail(),
        body("password").isLength({ min: 6 }),
        body("role").isIn(["Client", "Freelancer", "Admin"])
    ],
    validate,
    controller.register
);

router.post(
    "/login",
    [
        body("email").isEmail(),
        body("password").notEmpty()
    ],
    validate,
    controller.login
);

module.exports = router;