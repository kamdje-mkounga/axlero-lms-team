const EnrollmentRepository = require('../../infrastructure/database/mongoose/repositories/EnrollmentRepository');
const CourseRepository = require('../../infrastructure/database/mongoose/repositories/CourseRepository');

const enrollmentRepository = new EnrollmentRepository();
const courseRepository = new CourseRepository();

function sendError(res, statusCode, message) {
  return res.status(statusCode).json({
    success: false,
    message,
  });
}

// GET /api/enrollments/my
async function getMyEnrollments(req, res, next) {
  try {
    const enrollments = await enrollmentRepository.findByStudent(
      req.user.id
    );

    // S'assure que chaque cours lié à l'inscription est bien chargé/peuplé avec ses détails
    const enrichedEnrollments = await Promise.all(
      enrollments.map(async (en) => {
        const enObj = typeof en.toObject === 'function' ? en.toObject() : { ...en };

        // Si le cours est juste un ID ou ne possède pas de titre, on le récupère
        if (!enObj.course || typeof enObj.course !== 'object' || (!enObj.course.title && !enObj.course.name)) {
          const courseId = enObj.course || enObj.courseId;
          if (courseId) {
            const course = await courseRepository.findById(courseId);
            if (course) {
              enObj.course = typeof course.toObject === 'function' ? course.toObject() : course;
            }
          }
        }
        return enObj;
      })
    );

    return res.status(200).json({
      success: true,
      count: enrichedEnrollments.length,
      data: enrichedEnrollments,
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/enrollments
async function enrollInCourse(req, res, next) {
  try {
    const { courseId } = req.body;

    if (!courseId) {
      return sendError(res, 400, 'Course ID is required');
    }

    const course = await courseRepository.findById(courseId);

    if (!course || course.status !== 'published') {
      return sendError(res, 404, 'Published course not found');
    }

    const existingEnrollment =
      await enrollmentRepository.findByStudentAndCourse(
        req.user.id,
        courseId
      );

    if (existingEnrollment) {
      return sendError(res, 409, 'You are already enrolled in this course');
    }

    const enrollment = await enrollmentRepository.create({
      student: req.user.id,
      course: courseId,
    });

    return res.status(201).json({
      success: true,
      message: 'Successfully enrolled in course',
      data: enrollment,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/enrollments/:id
async function getEnrollment(req, res, next) {
  try {
    const enrollment = await enrollmentRepository.findById(
      req.params.id
    );

    if (!enrollment) {
      return sendError(res, 404, 'Enrollment not found');
    }

    const isOwner =
      String(enrollment.student) === String(req.user.id);

    if (!isOwner && req.user.role !== 'admin') {
      return sendError(res, 403, 'You cannot view this enrollment');
    }

    return res.status(200).json({
      success: true,
      data: enrollment,
    });
  } catch (error) {
    next(error);
  }
}

// PATCH /api/enrollments/:id/progress
async function updateProgress(req, res, next) {
  try {
    const { completedLessonIds } = req.body;

    if (!Array.isArray(completedLessonIds)) {
      return sendError(
        res,
        400,
        'completedLessonIds must be an array'
      );
    }

    const enrollment = await enrollmentRepository.findById(
      req.params.id
    );

    if (!enrollment) {
      return sendError(res, 404, 'Enrollment not found');
    }

    const isOwner =
      String(enrollment.student) === String(req.user.id);

    if (!isOwner) {
      return sendError(
        res,
        403,
        'You cannot update this enrollment'
      );
    }

    const updatedEnrollment =
      await enrollmentRepository.updateProgress(
        req.params.id,
        completedLessonIds
      );

    return res.status(200).json({
      success: true,
      message: 'Progress updated successfully',
      data: updatedEnrollment,
    });
  } catch (error) {
    if (
      error.name === 'ValidationError' ||
      error.name === 'CastError' ||
      /lesson/i.test(error.message || '')
    ) {
      error.statusCode = 400;
    }

    next(error);
  }
}

module.exports = {
  getMyEnrollments,
  enrollInCourse,
  getEnrollment,
  updateProgress,
};