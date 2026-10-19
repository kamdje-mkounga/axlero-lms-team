class ICourseRepository {
  async create(course) {
    throw new Error('Method create() must be implemented');
  }

  async findById(id) {
    throw new Error('Method findById() must be implemented');
  }

  async findAll(filters) {
    throw new Error('Method findAll() must be implemented');
  }

  async findByInstructor(instructorId) {
    throw new Error('Method findByInstructor() must be implemented');
  }

  async update(id, updates) {
    throw new Error('Method update() must be implemented');
  }

  async delete(id) {
    throw new Error('Method delete() must be implemented');
  }
}

module.exports = ICourseRepository;