
const express = require("express");
const mongoose = require("mongoose");
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Student enroll in a course
router.post("/:courseId", protect, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({
        message: "Only students can enroll in courses",
      });
    }

    const { courseId } = req.params;

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid course ID" });
    }

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const existing = await Enrollment.findOne({
      student: req.user._id,
      course: courseId,
    });

    if (existing) {
      return res.status(409).json({
        message: "You are already enrolled in this course",
      });
    }

    const enrollment = await Enrollment.create({
      student: req.user._id,
      course: courseId,
    });

    res.status(201).json({
      message: "Enrolled successfully!",
      enrollment,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "You are already enrolled in this course",
      });
    }

    console.error("Enrollment error:", error.message);
    res.status(500).json({ message: "Enrollment failed" });
  }
});

// Get courses enrolled by the logged-in student
router.get("/my-learning", protect, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({
        message: "Only students can view My Learning",
      });
    }

    const enrollments = await Enrollment.find({
      student: req.user._id,
    })
      .populate({
        path: "course",
        populate: { path: "instructor", select: "name" },
      })
      .sort({ createdAt: -1 });

    res.json({ enrollments });
  } catch (error) {
    console.error("My Learning error:", error.message);
    res.status(500).json({ message: "Failed to load your courses" });
  }
});

module.exports = router;
