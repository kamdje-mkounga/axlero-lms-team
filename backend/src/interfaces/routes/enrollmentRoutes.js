
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

// Students can view their enrollments.
router.get(
  '/my',
  authorizeRoles('student', 'admin'),
  getMyEnrollments
);

// Students can enroll in published courses.
router.post(
  '/',
  authorizeRoles('student'),
  enrollInCourse
);

// View one enrollment.
router.get(
  '/:id',
  authorizeRoles('student', 'admin'),
  getEnrollment
);

// Update lesson completion progress.
router.patch(
  '/:id/progress',
  authorizeRoles('student'),
  updateProgress
);

module.exports = router;
