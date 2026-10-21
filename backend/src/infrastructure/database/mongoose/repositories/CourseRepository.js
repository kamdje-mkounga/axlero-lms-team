const CourseModel = require('../models/CourseModel');
const Course = require('../../../../domain/entities/Course');
const ICourseRepository = require('../../../../application/repositories/ICourseRepository');

class CourseRepository extends ICourseRepository {
  toEntity(document) {
    if (!document) return null;

    const course = document.toObject
      ? document.toObject()
      : document;

    return new Course({
      id: course._id ? course._id.toString() : course.id,
      title: course.title,
      description: course.description,
      instructor: course.instructor,
      category: course.category,
      level: course.level,
      status: course.status,
      chapters: course.chapters || [],
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    });
  }

  async create(courseData) {
    const course = await CourseModel.create(courseData);
    return this.toEntity(course);
  }

  async findById(id) {
    const course = await CourseModel.findById(id);
    return this.toEntity(course);
  }

  async findAll(filters = {}) {
    const query = {};

    if (filters.status) query.status = filters.status;
    if (filters.category) query.category = filters.category;
    if (filters.level) query.level = filters.level;

    let request = CourseModel.find(query);

    if (filters.page || filters.limit) {
      const page = Math.max(1, Number(filters.page) || 1);
      const limit = Math.min(
        100,
        Math.max(1, Number(filters.limit) || 10)
      );

      request = request.skip((page - 1) * limit).limit(limit);
    }

    const courses = await request.sort({ createdAt: -1 });

    return courses.map((course) => this.toEntity(course));
  }

  async findByInstructor(instructorId) {
    const courses = await CourseModel.find({
      instructor: instructorId,
    }).sort({ createdAt: -1 });

    return courses.map((course) => this.toEntity(course));
  }

  async update(id, updates) {
    const allowedFields = [
      'title',
      'description',
      'category',
      'level',
      'status',
      'chapters',
    ];

    const safeUpdates = {};

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        safeUpdates[field] = updates[field];
      }
    }

    const course = await CourseModel.findByIdAndUpdate(
      id,
      safeUpdates,
      {
        new: true,
        runValidators: true,
      }
    );

    return this.toEntity(course);
  }

  async delete(id) {
    const course = await CourseModel.findByIdAndDelete(id);
    return Boolean(course);
  }
}

module.exports = CourseRepository;