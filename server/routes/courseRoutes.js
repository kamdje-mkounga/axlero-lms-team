
const express = require("express");
const mongoose = require("mongoose");

const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const {
  protect,
  instructorOnly,
} = require("../middleware/authMiddleware");

const router = express.Router();

// 1. Create a course
router.post("/", protect, instructorOnly, async (req, res) => {
  try {
    const { title, description, category } = req.body;

    if (!title?.trim() || !description?.trim() || !category?.trim()) {
      return res.status(400).json({
        message: "Title, description and category are required",
      });
    }

    const course = await Course.create({
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      instructor: req.user._id,
    });

    return res.status(201).json({
      message: "Course created successfully",
      course,
    });
  } catch (error) {
    console.error("Course creation error:", error.message);
    return res.status(500).json({
      message: "Failed to create course",
    });
  }
});

// 2. Get instructor's own courses
router.get("/my-courses", protect, instructorOnly, async (req, res) => {
  try {
    const courses = await Course.find({
      instructor: req.user._id,
    }).sort({ createdAt: -1 });

    return res.json({ courses });
  } catch (error) {
    console.error("Fetch courses error:", error.message);
    return res.status(500).json({
      message: "Failed to fetch courses",
    });
  }
});

// 3. Add a lesson
router.post(
  "/:courseId/lessons",
  protect,
  instructorOnly,
  async (req, res) => {
    try {
      const { courseId } = req.params;
      const { title, type, content, videoUrl } = req.body;

      if (!mongoose.isValidObjectId(courseId)) {
        return res.status(400).json({ message: "Invalid course ID" });
      }

      if (
        !title?.trim() ||
        !["text", "video"].includes(type)
      ) {
        return res.status(400).json({
          message: "Lesson title and valid lesson type are required",
        });
      }

      if (type === "text" && !content?.trim()) {
        return res.status(400).json({
          message: "Content is required for a text lesson",
        });
      }

      if (type === "video" && !videoUrl?.trim()) {
        return res.status(400).json({
          message: "Video URL is required for a video lesson",
        });
      }

      const course = await Course.findById(courseId);

      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      if (course.instructor.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          message: "You can only add lessons to your own courses",
        });
      }

      course.lessons.push({
        title: title.trim(),
        type,
        content: content || "",
        videoUrl: videoUrl || "",
      });

      await course.save();

      return res.status(201).json({
        message: "Lesson added successfully",
        lessons: course.lessons,
      });
    } catch (error) {
      console.error("Add lesson error:", error.message);
      return res.status(500).json({
        message: "Failed to add lesson",
      });
    }
  }
);

// 4. Get lessons for course owner or enrolled student
router.get("/:courseId/lessons", protect, async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid course ID" });
    }

    const course = await Course.findById(courseId)
      .select("title instructor lessons");

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const isOwner =
      req.user.role === "instructor" &&
      course.instructor.toString() === req.user._id.toString();

    if (!isOwner) {
      if (req.user.role !== "student") {
        return res.status(403).json({ message: "Access denied" });
      }

      const enrollment = await Enrollment.findOne({
        student: req.user._id,
        course: course._id,
      });

      if (!enrollment) {
        return res.status(403).json({
          message: "Enroll in this course to view its lessons",
        });
      }
    }

    return res.json({
      course: {
        _id: course._id,
        title: course.title,
      },
      lessons: course.lessons,
    });
  } catch (error) {
    console.error("Fetch lessons error:", error.message);
    return res.status(500).json({
      message: "Failed to fetch lessons",
    });
  }
});

// 5. Instructor adds a quiz question
router.post(
  "/:courseId/quizzes",
  protect,
  instructorOnly,
  async (req, res) => {
    try {
      const { courseId } = req.params;
      const { question, options, correctAnswer } = req.body;

      if (!mongoose.isValidObjectId(courseId)) {
        return res.status(400).json({ message: "Invalid course ID" });
      }

      if (
        typeof question !== "string" ||
        !question.trim() ||
        !Array.isArray(options) ||
        options.length < 2 ||
        options.some(
          (option) =>
            typeof option !== "string" || !option.trim()
        ) ||
        typeof correctAnswer !== "string" ||
        !options.some(
          (option) => option.trim() === correctAnswer.trim()
        )
      ) {
        return res.status(400).json({
          message:
            "Enter a question, at least two options and a correct answer matching one option",
        });
      }

      const course = await Course.findById(courseId);

      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      if (course.instructor.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          message: "You can only add quizzes to your own courses",
        });
      }

      const cleanedOptions = options.map((option) => option.trim());

      course.quizzes.push({
        question: question.trim(),
        options: cleanedOptions,
        correctAnswer: correctAnswer.trim(),
      });

      await course.save();

      // Do not expose correct answers
      const quizzes = course.quizzes.map((quiz) => ({
        _id: quiz._id,
        question: quiz.question,
        options: quiz.options,
      }));

      return res.status(201).json({
        message: "Quiz question added successfully",
        quizzes,
      });
    } catch (error) {
      console.error("Add quiz error:", error.message);
      return res.status(500).json({
        message: "Failed to add quiz question",
      });
    }
  }
);

// 6. Get quiz questions for owner or enrolled student
router.get("/:courseId/quizzes", protect, async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid course ID" });
    }

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const isOwner =
      req.user.role === "instructor" &&
      course.instructor.toString() === req.user._id.toString();

    if (!isOwner) {
      if (req.user.role !== "student") {
        return res.status(403).json({ message: "Access denied" });
      }

      const enrollment = await Enrollment.findOne({
        student: req.user._id,
        course: course._id,
      });

      if (!enrollment) {
        return res.status(403).json({
          message: "Enroll in this course to view its quiz",
        });
      }
    }

    const quizzes = course.quizzes.map((quiz) => ({
      _id: quiz._id,
      question: quiz.question,
      options: quiz.options,
    }));

    return res.json({ quizzes });
  } catch (error) {
    console.error("Fetch quizzes error:", error.message);
    return res.status(500).json({
      message: "Failed to fetch quizzes",
    });
  }
});

// 7. Student submits quiz answers and gets score
router.post("/:courseId/quizzes/submit", protect, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { answers } = req.body;

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid course ID" });
    }

    if (req.user.role !== "student") {
      return res.status(403).json({
        message: "Only students can submit quiz answers",
      });
    }

    if (!Array.isArray(answers)) {
      return res.status(400).json({
        message: "Answers must be an array",
      });
    }

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: course._id,
    });

    if (!enrollment) {
      return res.status(403).json({
        message: "Enroll in this course before submitting its quiz",
      });
    }

    if (course.quizzes.length === 0) {
      return res.status(400).json({
        message: "This course has no quiz questions yet",
      });
    }

    let score = 0;

    for (const quiz of course.quizzes) {
      const submittedAnswer = answers.find(
        (answer) =>
          answer.quizId === quiz._id.toString()
      );

      if (
        submittedAnswer &&
        submittedAnswer.answer === quiz.correctAnswer
      ) {
        score += 1;
      }
    }

    const total = course.quizzes.length;

    return res.json({
      message: "Quiz submitted successfully",
      score,
      total,
      percentage: Math.round((score / total) * 100),
    });
  } catch (error) {
    console.error("Submit quiz error:", error.message);
    return res.status(500).json({
      message: "Failed to submit quiz",
    });
  }
});

// 8. Get all public courses
router.get("/", async (req, res) => {
  try {
    const courses = await Course.find()
      .populate("instructor", "name")
      .sort({ createdAt: -1 });

    return res.json({ courses });
  } catch (error) {
    console.error("Public courses error:", error.message);
    return res.status(500).json({
      message: "Failed to fetch courses",
    });
  }
});

module.exports = router;
