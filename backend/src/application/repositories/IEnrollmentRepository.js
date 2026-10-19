class IEnrollmentRepository {
  async create(enrollment) {
    throw new Error('Method create() must be implemented');
  }

  async findById(id) {
    throw new Error('Method findById() must be implemented');
  }

  async findByStudent(studentId) {
    throw new Error('Method findByStudent() must be implemented');
  }

  async findByStudentAndCourse(studentId, courseId) {
    throw new Error(
      'Method findByStudentAndCourse() must be implemented'
    );
  }

  async updateProgress(id, completedLessonIds) {
    throw new Error('Method updateProgress() must be implemented');
  }

  async delete(id) {
    throw new Error('Method delete() must be implemented');
  }
}

module.exports = IEnrollmentRepository;