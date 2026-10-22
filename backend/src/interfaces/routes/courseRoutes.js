
const express = require('express');

const {
  listCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
} = require('../controllers/courseController');

const {
  authMiddleware,
  authorizeRoles,
} = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.get('/', listCourses);
router.get('/:id', getCourse);

// Only instructors and admins can manage courses
router.post(
  '/',
  authMiddleware,
  authorizeRoles('instructor', 'admin'),
  createCourse
);

router.put(
  '/:id',
  authMiddleware,
  authorizeRoles('instructor', 'admin'),
  updateCourse
);

router.delete(
  '/:id',
  authMiddleware,
  authorizeRoles('instructor', 'admin'),
  deleteCourse
);

module.exports = router;
