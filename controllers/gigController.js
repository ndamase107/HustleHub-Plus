
const mongoose = require("mongoose");
const Gig = require("../models/Gig");

const validId = (id) => mongoose.isValidObjectId(id);

const validPrice = (price) =>
  typeof price === "number" &&
  Number.isFinite(price) &&
  price >= 0;

const validText = (value, max) =>
  typeof value === "string" &&
  value.trim().length > 0 &&
  value.trim().length <= max;

exports.getGigs = async (req, res, next) => {
  try {
    const gigs = await Gig.find({ status: "Active" })
      .populate("freelancer", "name")
      .sort({ createdAt: -1 });

    res.json({ success: true, gigs });
  } catch (error) {
    next(error);
  }
};

exports.getGig = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({ message: "Invalid gig ID" });
    }

    const gig = await Gig.findOne({
      _id: req.params.id,
      status: "Active"
    }).populate("freelancer", "name");

    if (!gig) {
      return res.status(404).json({ message: "Gig not found" });
    }

    res.json({ success: true, gig });
  } catch (error) {
    next(error);
  }
};

exports.createGig = async (req, res, next) => {
  try {
    const { title, description, category, price } = req.body;

    if (
      !validText(title, 120) ||
      !validText(description, 2000) ||
      !validText(category, 100) ||
      !validPrice(price)
    ) {
      return res.status(400).json({
        message: "Valid title, description, category and price required"
      });
    }

    const gig = await Gig.create({
      freelancer: req.user.id,
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      price
    });

    res.status(201).json({ success: true, gig });
  } catch (error) {
    next(error);
  }
};

exports.updateGig = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({ message: "Invalid gig ID" });
    }

    const allowed = [
      "title", "description", "category", "price", "status"
    ];

    const updates = {};

    for (const key of Object.keys(req.body)) {
      if (!allowed.includes(key)) {
        return res.status(400).json({
          message: `Field not allowed: ${key}`
        });
      }
      updates[key] = req.body[key];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No changes provided" });
    }

    for (const key of ["title", "description", "category"]) {
      if (key in updates) {
        const max = key === "description" ? 2000 :
                    key === "title" ? 120 : 100;

        if (!validText(updates[key], max)) {
          return res.status(400).json({
            message: `Invalid ${key}`
          });
        }
        updates[key] = updates[key].trim();
      }
    }

    if ("price" in updates && !validPrice(updates.price)) {
      return res.status(400).json({ message: "Invalid price" });
    }

    if ("status" in updates &&
        !["Active", "Inactive"].includes(updates.status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const gig = await Gig.findOneAndUpdate(
      { _id: req.params.id, freelancer: req.user.id },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!gig) {
      return res.status(404).json({
        message: "Gig not found or not owned by you"
      });
    }

    res.json({ success: true, gig });
  } catch (error) {
    next(error);
  }
};

exports.deleteGig = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({ message: "Invalid gig ID" });
    }

    // Soft deletion preserves existing bookings.
    const gig = await Gig.findOneAndUpdate(
      { _id: req.params.id, freelancer: req.user.id },
      { $set: { status: "Inactive" } },
      { new: true }
    );

    if (!gig) {
      return res.status(404).json({
        message: "Gig not found or not owned by you"
      });
    }

    res.json({
      success: true,
      message: "Gig removed from public listings"
    });
  } catch (error) {
    next(error);
  }
};
