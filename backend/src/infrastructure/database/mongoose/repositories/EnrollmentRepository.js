const mongoose = require('mongoose');

const EnrollmentModel = require('../models/EnrollmentModel');
const CourseModel = require('../models/CourseModel');

const Enrollment = require('../../../../domain/entities/Enrollment');
const IEnrollmentRepository = require(
  '../../../../application/repositories/IEnrollmentRepository'
);

class EnrollmentRepository extends IEnrollmentRepository {
  toEntity(document) {
    if (!document) return null;

    const enrollment = document.toObject
      ? document.toObject()
      : document;

    return new Enrollment({
      id: enrollment._id
        ? enrollment._id.toString()
        : enrollment.id,

      student: enrollment.student,
      course: enrollment.course,
      status: enrollment.status,
      completedLessons: enrollment.completedLessons || [],
      progressPercentage: enrollment.progressPercentage,
      enrolledAt: enrollment.enrolledAt,
      completedAt: enrollment.completedAt,
      createdAt: enrollment.createdAt,
      updatedAt: enrollment.updatedAt,
    });
  }

  async create(enrollmentData) {
    const enrollment = await EnrollmentModel.create({
      student: enrollmentData.student,
      course: enrollmentData.course,
    });

    return this.toEntity(enrollment);
  }

  async findById(id) {
    const enrollment = await EnrollmentModel.findById(id);
    return this.toEntity(enrollment);
  }

  async findByStudent(studentId) {
    const enrollments = await EnrollmentModel.find({
      student: studentId,
    }).sort({ enrolledAt: -1 });

    return enrollments.map((item) => this.toEntity(item));
  }

  async findByStudentAndCourse(studentId, courseId) {
    const enrollment = await EnrollmentModel.findOne({
      student: studentId,
      course: courseId,
    });

    return this.toEntity(enrollment);
  }

  async updateProgress(id, completedLessonIds) {
    const enrollment = await EnrollmentModel.findById(id);

    if (!enrollment) {
      return null;
    }

    const course = await CourseModel.findById(enrollment.course);

    if (!course) {
      throw new Error('Enrolled course was not found');
    }

    const validLessonIds = new Set(
      course.chapters.flatMap((chapter) =>
        chapter.lessons.map((lesson) => lesson._id.toString())
      )
    );

    const uniqueCompletedIds = [
      ...new Set(completedLessonIds.map(String)),
    ];

    for (const lessonId of uniqueCompletedIds) {
      if (!mongoose.isValidObjectId(lessonId)) {
        throw new Error(`Invalid lesson ID: ${lessonId}`);
      }

      if (!validLessonIds.has(lessonId)) {
        throw new Error(
          `Lesson ${lessonId} does not belong to this course`
        );
      }
    }

    const totalLessons = validLessonIds.size;

    const percentage = totalLessons === 0
      ? 0
      : Math.round(
          (uniqueCompletedIds.length / totalLessons) * 100
        );

    const isCompleted =
      totalLessons > 0 && percentage === 100;

    enrollment.completedLessons = uniqueCompletedIds;
    enrollment.progressPercentage = percentage;

    enrollment.status = isCompleted
      ? 'completed'
      : uniqueCompletedIds.length > 0
        ? 'in-progress'
        : 'enrolled';

    enrollment.completedAt = isCompleted
      ? enrollment.completedAt || new Date()
      : null;

    await enrollment.save();

    return this.toEntity(enrollment);
  }

  async delete(id) {
    const enrollment = await EnrollmentModel.findByIdAndDelete(id);
    return Boolean(enrollment);
  }
}

module.exports = EnrollmentRepository;