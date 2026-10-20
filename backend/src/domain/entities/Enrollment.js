class Enrollment {
  constructor({
    id = null,
    student,
    course,
    status = 'enrolled',
    completedLessons = [],
    progressPercentage = 0,
    enrolledAt = null,
    completedAt = null,
    createdAt = null,
    updatedAt = null,
  }) {
    if (!student) {
      throw new Error('Student is required');
    }

    if (!course) {
      throw new Error('Course is required');
    }

    if (!['enrolled', 'in-progress', 'completed'].includes(status)) {
      throw new Error('Invalid enrollment status');
    }

    if (
      !Number.isFinite(progressPercentage) ||
      progressPercentage < 0 ||
      progressPercentage > 100
    ) {
      throw new Error('Progress must be between 0 and 100');
    }

    this.id = id;
    this.student = student;
    this.course = course;
    this.status = status;
    this.completedLessons = completedLessons;
    this.progressPercentage = progressPercentage;
    this.enrolledAt = enrolledAt;
    this.completedAt = completedAt;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  isCompleted() {
    return this.status === 'completed';
  }
}

module.exports = Enrollment;