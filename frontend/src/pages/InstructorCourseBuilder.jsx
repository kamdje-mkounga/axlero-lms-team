
import { useState } from 'react';

const createLesson = () => ({
  id: crypto.randomUUID(),
  title: '',
  description: '',
  videoUrl: '',
});

const createChapter = () => ({
  id: crypto.randomUUID(),
  title: '',
  lessons: [createLesson()],
});

export default function InstructorCourseBuilder() {
  const [course, setCourse] = useState({
    title: '',
    description: '',
    category: 'Web Development',
    level: 'Beginner',
    chapters: [createChapter()],
  });

  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState('');

  function updateCourse(field, value) {
    setCourse((current) => ({ ...current, [field]: value }));
    setMessage('');
  }

  function updateChapter(chapterId, field, value) {
    setCourse((current) => ({
      ...current,
      chapters: current.chapters.map((chapter) =>
        chapter.id === chapterId
          ? { ...chapter, [field]: value }
          : chapter
      ),
    }));
    setMessage('');
  }

  function updateLesson(chapterId, lessonId, field, value) {
    setCourse((current) => ({
      ...current,
      chapters: current.chapters.map((chapter) =>
        chapter.id === chapterId
          ? {
              ...chapter,
              lessons: chapter.lessons.map((lesson) =>
                lesson.id === lessonId
                  ? { ...lesson, [field]: value }
                  : lesson
              ),
            }
          : chapter
      ),
    }));
    setMessage('');
  }

  function addChapter() {
    setCourse((current) => ({
      ...current,
      chapters: [...current.chapters, createChapter()],
    }));
  }

  function removeChapter(chapterId) {
    setCourse((current) => ({
      ...current,
      chapters: current.chapters.filter(
        (chapter) => chapter.id !== chapterId
      ),
    }));
  }

  function addLesson(chapterId) {
    setCourse((current) => ({
      ...current,
      chapters: current.chapters.map((chapter) =>
        chapter.id === chapterId
          ? { ...chapter, lessons: [...chapter.lessons, createLesson()] }
          : chapter
      ),
    }));
  }

  function removeLesson(chapterId, lessonId) {
    setCourse((current) => ({
      ...current,
      chapters: current.chapters.map((chapter) =>
        chapter.id === chapterId
          ? {
              ...chapter,
              lessons: chapter.lessons.filter(
                (lesson) => lesson.id !== lessonId
              ),
            }
          : chapter
      ),
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = {};

    if (!course.title.trim()) {
      nextErrors.title = 'Enter a course title.';
    }

    if (!course.description.trim()) {
      nextErrors.description = 'Enter a course description.';
    }

    if (course.chapters.length === 0) {
      nextErrors.chapters = 'Add at least one chapter.';
    }

    course.chapters.forEach((chapter, index) => {
      if (!chapter.title.trim()) {
        nextErrors[`chapter-${chapter.id}`] =
          `Enter a title for Chapter ${index + 1}.`;
      }

      if (chapter.lessons.length === 0) {
        nextErrors[`lessons-${chapter.id}`] =
          `Add at least one lesson to Chapter ${index + 1}.`;
      }

      chapter.lessons.forEach((lesson, lessonIndex) => {
        if (!lesson.title.trim()) {
          nextErrors[`lesson-${lesson.id}`] =
            `Enter a title for Lesson ${lessonIndex + 1} in Chapter ${index + 1}.`;
        }
      });
    });

    setErrors(nextErrors);
    setPreview(null);

    if (Object.keys(nextErrors).length > 0) {
      setMessage('Please fix the highlighted issues.');
      return;
    }

    setPreview({
      ...course,
      chapters: course.chapters.map((chapter) => ({
        ...chapter,
        lessons: chapter.lessons.map((lesson) => ({ ...lesson })),
      })),
    });

    setMessage(
      'Preview created successfully. This course has not been saved to the server.'
    );
  }

  return (
    <section className="student-page instructor-builder">
      <div className="builder-heading">
        <div>
          <p className="builder-eyebrow">INSTRUCTOR WORKSPACE</p>
          <h2>Create a Course</h2>
          <p>
            Organize your course into chapters and lessons for your students.
          </p>
        </div>
        <span className="builder-draft-badge">Draft</span>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <section className="builder-card">
          <h3>Course information</h3>

          <div className="builder-field">
            <label htmlFor="course-title">Course title *</label>
            <input
              id="course-title"
              value={course.title}
              onChange={(event) =>
                updateCourse('title', event.target.value)
              }
              placeholder="e.g. Full-Stack Web Development"
            />
            {errors.title && (
              <p className="builder-error">{errors.title}</p>
            )}
          </div>

          <div className="builder-field">
            <label htmlFor="course-description">Description *</label>
            <textarea
              id="course-description"
              rows={4}
              value={course.description}
              onChange={(event) =>
                updateCourse('description', event.target.value)
              }
              placeholder="What will students learn in this course?"
            />
            {errors.description && (
              <p className="builder-error">{errors.description}</p>
            )}
          </div>

          <div className="builder-fields-row">
            <div className="builder-field">
              <label htmlFor="course-category">Category</label>
              <select
                id="course-category"
                value={course.category}
                onChange={(event) =>
                  updateCourse('category', event.target.value)
                }
              >
                <option>Web Development</option>
                <option>Programming</option>
                <option>Data Science</option>
                <option>Artificial Intelligence</option>
                <option>Cybersecurity</option>
                <option>Other</option>
              </select>
            </div>

            <div className="builder-field">
              <label htmlFor="course-level">Difficulty level</label>
              <select
                id="course-level"
                value={course.level}
                onChange={(event) =>
                  updateCourse('level', event.target.value)
                }
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>
          </div>
        </section>

        <section className="builder-curriculum">
          <div className="builder-section-heading">
            <div>
              <h3>Course curriculum</h3>
              <p>
                {course.chapters.length} chapters ·{' '}
                {course.chapters.reduce(
                  (total, chapter) => total + chapter.lessons.length,
                  0
                )}{' '}
                lessons
              </p>
            </div>

            <button
              className="builder-secondary-button"
              type="button"
              onClick={addChapter}
            >
              + Add chapter
            </button>
          </div>

          {errors.chapters && (
            <p className="builder-error">{errors.chapters}</p>
          )}

          {course.chapters.map((chapter, chapterIndex) => (
            <article className="builder-chapter" key={chapter.id}>
              <div className="builder-chapter-heading">
                <span className="builder-number">
                  {String(chapterIndex + 1).padStart(2, '0')}
                </span>

                <div className="builder-chapter-title">
                  <label htmlFor={`chapter-${chapter.id}`}>
                    Chapter {chapterIndex + 1}
                  </label>
                  <input
                    id={`chapter-${chapter.id}`}
                    value={chapter.title}
                    onChange={(event) =>
                      updateChapter(
                        chapter.id,
                        'title',
                        event.target.value
                      )
                    }
                    placeholder="e.g. Introduction to React"
                  />
                </div>

                <button
                  type="button"
                  className="builder-remove-button"
                  onClick={() => removeChapter(chapter.id)}
                  aria-label={`Remove chapter ${chapterIndex + 1}`}
                >
                  Remove
                </button>
              </div>

              {errors[`chapter-${chapter.id}`] && (
                <p className="builder-error">
                  {errors[`chapter-${chapter.id}`]}
                </p>
              )}

              <div className="builder-lessons">
                {chapter.lessons.map((lesson, lessonIndex) => (
                  <div className="builder-lesson" key={lesson.id}>
                    <span className="builder-lesson-icon">▶</span>

                    <div className="builder-lesson-fields">
                      <label htmlFor={`lesson-${lesson.id}`}>
                        Lesson {lessonIndex + 1}
                      </label>

                      <input
                        id={`lesson-${lesson.id}`}
                        value={lesson.title}
                        onChange={(event) =>
                          updateLesson(
                            chapter.id,
                            lesson.id,
                            'title',
                            event.target.value
                          )
                        }
                        placeholder="Lesson title"
                      />

                      <input
                        value={lesson.description}
                        onChange={(event) =>
                          updateLesson(
                            chapter.id,
                            lesson.id,
                            'description',
                            event.target.value
                          )
                        }
                        placeholder="Short lesson description (optional)"
                        aria-label={`Description for lesson ${lessonIndex + 1}`}
                      />

                      <input
                        type="url"
                        value={lesson.videoUrl}
                        onChange={(event) =>
                          updateLesson(
                            chapter.id,
                            lesson.id,
                            'videoUrl',
                            event.target.value
                          )
                        }
                        placeholder="Video URL (optional)"
                        aria-label={`Video URL for lesson ${lessonIndex + 1}`}
                      />

                      {errors[`lesson-${lesson.id}`] && (
                        <p className="builder-error">
                          {errors[`lesson-${lesson.id}`]}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      className="builder-remove-button"
                      onClick={() =>
                        removeLesson(chapter.id, lesson.id)
                      }
                      aria-label={`Remove lesson ${lessonIndex + 1}`}
                    >
                      Remove
                    </button>
                  </div>
                ))}

                {errors[`lessons-${chapter.id}`] && (
                  <p className="builder-error">
                    {errors[`lessons-${chapter.id}`]}
                  </p>
                )}

                <button
                  type="button"
                  className="builder-add-lesson"
                  onClick={() => addLesson(chapter.id)}
                >
                  + Add lesson
                </button>
              </div>
            </article>
          ))}

          <button
            className="builder-secondary-button"
            type="button"
            onClick={addChapter}
          >
            + Add another chapter
          </button>
        </section>

        {message && (
          <p
            className={
              preview ? 'builder-success' : 'builder-error'
            }
            role="status"
          >
            {message}
          </p>
        )}

        <div className="builder-actions">
          <button type="submit" className="builder-primary-button">
            Preview course
          </button>
        </div>
      </form>

      {preview && (
        <section className="builder-card builder-preview">
          <p className="builder-eyebrow">COURSE PREVIEW</p>
          <h3>{preview.title}</h3>
          <p>{preview.description}</p>
          <p>
            <strong>Category:</strong> {preview.category} ·{' '}
            <strong>Level:</strong> {preview.level}
          </p>

          {preview.chapters.map((chapter, index) => (
            <div className="preview-chapter" key={chapter.id}>
              <h4>
                Chapter {index + 1}: {chapter.title}
              </h4>
              <ul>
                {chapter.lessons.map((lesson) => (
                  <li key={lesson.id}>
                    {lesson.title}
                    {lesson.description && ` — ${lesson.description}`}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p className="builder-preview-note">
            This is a local preview only. It will not persist after you
            reload the page.
          </p>
        </section>
      )}
    </section>
  );
}
