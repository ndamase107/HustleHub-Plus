
const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const authorize = require("../middleware/authorize");
const gigs = require("../controllers/gigController");

router.get("/", gigs.getGigs);
router.get("/:id", gigs.getGig);

router.post(
  "/",
  auth,
  authorize("Freelancer"),
  gigs.createGig
);

router.patch(
  "/:id",
  auth,
  authorize("Freelancer"),
  gigs.updateGig
);

router.delete(
  "/:id",
  auth,
  authorize("Freelancer"),
  gigs.deleteGig
);

module.exports = router;
