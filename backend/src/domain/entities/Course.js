class Course {
  constructor({
    id = null,
    title,
    description,
    instructor,
    category = 'General',
    level = 'beginner',
    status = 'draft',
    chapters = [],
    createdAt = null,
    updatedAt = null,
  }) {
    if (!title || !title.trim()) {
      throw new Error('Course title is required');
    }

    if (!description || !description.trim()) {
      throw new Error('Course description is required');
    }

    if (!instructor) {
      throw new Error('Course instructor is required');
    }

    if (!['beginner', 'intermediate', 'advanced'].includes(level)) {
      throw new Error('Invalid course level');
    }

    if (!['draft', 'published', 'archived'].includes(status)) {
      throw new Error('Invalid course status');
    }

    this.id = id;
    this.title = title.trim();
    this.description = description.trim();
    this.instructor = instructor;
    this.category = category;
    this.level = level;
    this.status = status;
    this.chapters = chapters;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  getTotalLessons() {
    return this.chapters.reduce(
      (total, chapter) => total + (chapter.lessons || []).length,
      0
    );
  }
}

module.exports = Course;