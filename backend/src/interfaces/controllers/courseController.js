const CourseRepository = require('../../infrastructure/database/mongoose/repositories/CourseRepository');

const courseRepository = new CourseRepository();

function sendError(res, statusCode, message) {
  return res.status(statusCode).json({ success: false, message });
}

async function listCourses(req, res, next) {
  try {
    const courses = await courseRepository.findAll({
      status: 'published',
      category: req.query.category,
      level: req.query.level,
      page: req.query.page,
      limit: req.query.limit,
    });
    return res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    next(error);
  }
}

async function getCourse(req, res, next) {
  try {
    const course = await courseRepository.findById(req.params.id);
    if (!course) return sendError(res, 404, 'Course not found');

    const isOwner = req.user && String(course.instructor) === String(req.user.id);
    const isAdmin = req.user && req.user.role === 'admin';

    if (course.status !== 'published' && !isOwner && !isAdmin) {
      return sendError(res, 404, 'Course not found');
    }

    return res.status(200).json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
}

async function createCourse(req, res, next) {
  try {
    const { title, description, category, level, status, chapters } = req.body;

    if (
      typeof title !== 'string' || !title.trim() ||
      typeof description !== 'string' || !description.trim()
    ) {
      return sendError(res, 400, 'Course title and description are required');
    }

    const course = await courseRepository.create({
      title: title.trim(),
      description: description.trim(),
      instructor: req.user.id,
      category,
      level,
      status: status || 'draft',
      chapters,
    });

    return res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: course,
    });
  } catch (error) {
    next(error);
  }
}

async function updateCourse(req, res, next) {
  try {
    const existing = await courseRepository.findById(req.params.id);
    if (!existing) return sendError(res, 404, 'Course not found');

    const isOwner = String(existing.instructor) === String(req.user.id);
    if (!isOwner && req.user.role !== 'admin') {
      return sendError(res, 403, 'You cannot update this course');
    }

    const updates = { ...req.body };
    delete updates.instructor;
    delete updates.id;
    delete updates._id;

    const course = await courseRepository.update(req.params.id, updates);

    return res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      data: course,
    });
  } catch (error) {
    next(error);
  }
}

async function deleteCourse(req, res, next) {
  try {
    const existing = await courseRepository.findById(req.params.id);
    if (!existing) return sendError(res, 404, 'Course not found');

    const isOwner = String(existing.instructor) === String(req.user.id);
    if (!isOwner && req.user.role !== 'admin') {
      return sendError(res, 403, 'You cannot delete this course');
    }

    await courseRepository.delete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
};
