
const express = require("express");
const mongoose = require("mongoose");

const Progress = require("../models/Progress");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Get progress for an enrolled course
router.get("/:courseId", protect, async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid course ID" });
    }

    const course = await Course.findById(courseId).select("lessons");

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (req.user.role !== "student") {
      return res.status(403).json({
        message: "Only students can access learning progress",
      });
    }

    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId,
    });

    if (!enrollment) {
      return res.status(403).json({
        message: "Enroll in this course first",
      });
    }

    const progress = await Progress.findOne({
      student: req.user._id,
      course: courseId,
    });

    const completedLessons = progress?.completedLessons || [];
    const totalLessons = course.lessons.length;
    const completedCount = completedLessons.length;
    const percentage =
      totalLessons === 0
        ? 0
        : Math.round((completedCount / totalLessons) * 100);

    return res.json({
      courseId,
      completedLessons,
      totalLessons,
      completedCount,
      percentage,
    });
  } catch (error) {
    console.error("Get progress error:", error.message);
    return res.status(500).json({
      message: "Failed to get progress",
    });
  }
});

// Mark a lesson as completed
router.post("/:courseId/complete/:lessonId", protect, async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;

    if (
      !mongoose.isValidObjectId(courseId) ||
      !mongoose.isValidObjectId(lessonId)
    ) {
      return res.status(400).json({
        message: "Invalid course or lesson ID",
      });
    }

    if (req.user.role !== "student") {
      return res.status(403).json({
        message: "Only students can complete lessons",
      });
    }

    const course = await Course.findById(courseId).select("lessons");

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const lessonExists = course.lessons.some(
      (lesson) => lesson._id.toString() === lessonId
    );

    if (!lessonExists) {
      return res.status(404).json({
        message: "Lesson not found in this course",
      });
    }

    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId,
    });

    if (!enrollment) {
      return res.status(403).json({
        message: "Enroll in this course first",
      });
    }

    const progress = await Progress.findOneAndUpdate(
      {
        student: req.user._id,
        course: courseId,
      },
      {
        $addToSet: { completedLessons: lessonId },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.json({
      message: "Lesson marked as complete",
      completedLessons: progress.completedLessons,
    });
  } catch (error) {
    console.error("Complete lesson error:", error.message);
    return res.status(500).json({
      message: "Failed to update progress",
    });
  }
});

module.exports = router;
