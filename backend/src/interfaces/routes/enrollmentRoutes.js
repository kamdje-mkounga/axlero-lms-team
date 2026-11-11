const express = require('express');

const {
  getMyEnrollments,
  enrollInCourse,
  getEnrollment,
  updateProgress,
} = require('../controllers/enrollmentController');

const {
  authMiddleware,
  authorizeRoles,
} = require('../middleware/authMiddleware');

const router = express.Router();

// All enrollment routes require authentication.
router.use(authMiddleware);

// Students and instructors can view their enrollments.
router.get(
  '/me',
  authorizeRoles('student', 'admin', 'instructor'),
  getMyEnrollments
);

// Students and instructors can enroll in courses.
router.post(
  '/',
  authorizeRoles('student', 'instructor'),
  enrollInCourse
);

// View one enrollment.
router.get(
  '/:id',
  authorizeRoles('student', 'admin', 'instructor'),
  getEnrollment
);

// Update lesson completion progress.
router.patch(
  '/:id/progress',
  authorizeRoles('student', 'instructor'),
  updateProgress
);

module.exports = router;