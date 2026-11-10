import { useMemo, useState } from 'react';
import { createCourse } from '../api/courseApi';

const createId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `item-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const createLesson = () => ({
  id: createId(),
  title: "",
  description: "",
  videoUrl: "",
  durationMinutes: "",
});

const createChapter = () => ({
  id: createId(),
  title: "",
  description: "",
  lessons: [createLesson()],
});

const createQuizQuestion = () => ({
  id: createId(),
  question: "",
  options: ["", "", "", ""],
  correct: 0,
});

function countLessons(chapters) {
  return chapters.reduce((total, chapter) => total + chapter.lessons.length, 0);
}

function isValidHttpUrl(value) {
  if (!value.trim()) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export default function InstructorCourseBuilder({ onNavigateToCatalog }) {
  const [course, setCourse] = useState({
    title: "",
    description: "",
    category: "Web Development",
    level: "Beginner",
    chapters: [createChapter()],
    quizzes: [createQuizQuestion()],
  });
  const [courseId, setCourseId] = useState(null);
  const [courseStatus, setCourseStatus] = useState("draft");
  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [saving, setSaving] = useState(false);

  const lessonCount = useMemo(
    () => countLessons(course.chapters),
    [course.chapters],
  );

  const completedFields = useMemo(() => {
    const required = [
      Boolean(course.title.trim()),
      Boolean(course.description.trim()),
      course.chapters.length > 0,
      ...course.chapters.flatMap((chapter) => [
        Boolean(chapter.title.trim()),
        chapter.lessons.length > 0,
        ...chapter.lessons.map((lesson) => Boolean(lesson.title.trim())),
      ]),
    ];
    return required.filter(Boolean).length;
  }, [course]);

  const totalFields =
    3 +
    course.chapters.reduce(
      (total, chapter) => total + 2 + chapter.lessons.length,
      0,
    );
  const completion = Math.round(
    (completedFields / Math.max(totalFields, 1)) * 100,
  );

  function clearError(key) {
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function updateCourse(field, value) {
    setCourse((current) => ({ ...current, [field]: value }));
    clearError(field);
    setPreview(null);
    setMessage("");
  }

  function updateChapter(chapterId, field, value) {
    setCourse((current) => ({
      ...current,
      chapters: current.chapters.map((chapter) =>
        chapter.id === chapterId ? { ...chapter, [field]: value } : chapter,
      ),
    }));
    clearError(`chapter-${chapterId}`);
    clearError(`lessons-${chapterId}`);
    setPreview(null);
    setMessage("");
  }

  function updateLesson(chapterId, lessonId, field, value) {
    setCourse((current) => ({
      ...current,
      chapters: current.chapters.map((chapter) =>
        chapter.id === chapterId
          ? {
            ...chapter,
            lessons: chapter.lessons.map((lesson) =>
              lesson.id === lessonId ? { ...lesson, [field]: value } : lesson
            ),
          }
          : chapter
      ),
    }));
    clearError(`lesson-${lessonId}`);
    if (field === "videoUrl" && !isValidHttpUrl(value)) {
      setErrors((current) => ({
        ...current,
        [`video-${lessonId}`]: "Enter a valid http:// or https:// URL.",
      }));
    } else {
      clearError(`video-${lessonId}`);
    }
    setPreview(null);
    setMessage("");
  }

  // Gestion des Quiz
  function addQuizQuestion() {
    setCourse((current) => ({
      ...current,
      quizzes: [...current.quizzes, createQuizQuestion()],
    }));
    setPreview(null);
  }

  function updateQuiz(quizId, field, value) {
    setCourse((current) => ({
      ...current,
      quizzes: current.quizzes.map((q) =>
        q.id === quizId ? { ...q, [field]: value } : q
      ),
    }));
    setPreview(null);
  }

  function updateQuizOption(quizId, optionIndex, value) {
    setCourse((current) => ({
      ...current,
      quizzes: current.quizzes.map((q) => {
        if (q.id === quizId) {
          const newOptions = [...q.options];
          newOptions[optionIndex] = value;
          return { ...q, options: newOptions };
        }
        return q;
      }),
    }));
    setPreview(null);
  }

  function removeQuizQuestion(quizId) {
    if (course.quizzes.length <= 1) {
      setMessage("A course must have at least one quiz question.");
      setMessageType("error");
      return;
    }
    setCourse((current) => ({
      ...current,
      quizzes: current.quizzes.filter((q) => q.id !== quizId),
    }));
    setPreview(null);
  }

  function addChapter() {
    setCourse((current) => ({
      ...current,
      chapters: [...current.chapters, createChapter()],
    }));
    clearError("chapters");
    setPreview(null);
    setMessage("");
  }

  function removeChapter(chapterId) {
    const chapter = course.chapters.find((item) => item.id === chapterId);
    if (!chapter) return;
    if (
      !window.confirm(
        `Remove "${chapter.title.trim() || "this chapter"}" and all its lessons?`,
      )
    )
      return;

    setCourse((current) => ({
      ...current,
      chapters: current.chapters.filter((item) => item.id !== chapterId),
    }));
    setErrors((current) => {
      const next = { ...current };
      delete next[`chapter-${chapterId}`];
      delete next[`lessons-${chapterId}`];
      chapter.lessons.forEach((lesson) => {
        delete next[`lesson-${lesson.id}`];
        delete next[`video-${lesson.id}`];
      });
      return next;
    });
    setPreview(null);
    setMessage("");
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
    clearError(`lessons-${chapterId}`);
    setPreview(null);
    setMessage("");
  }

  function removeLesson(chapterId, lessonId) {
    const chapter = course.chapters.find((item) => item.id === chapterId);
    if (!chapter || chapter.lessons.length <= 1) {
      setMessage(
        "Each chapter must contain at least one lesson. Add another lesson before removing this one.",
      );
      setMessageType("error");
      return;
    }

    const lesson = chapter.lessons.find((item) => item.id === lessonId);
    if (!window.confirm(`Remove "${lesson?.title.trim() || "this lesson"}"?`))
      return;

    setCourse((current) => ({
      ...current,
      chapters: current.chapters.map((item) =>
        item.id === chapterId
          ? {
            ...item,
            lessons: item.lessons.filter((entry) => entry.id !== lessonId),
          }
          : item
      ),
    }));
    setErrors((current) => {
      const next = { ...current };
      delete next[`lesson-${lessonId}`];
      delete next[`video-${lessonId}`];
      return next;
    });
    setPreview(null);
    setMessage("");
  }

  function validateForm() {
    const nextErrors = {};

    if (!course.title.trim()) {
      nextErrors.title = "Enter a course title.";
    }

    if (!course.description.trim()) {
      nextErrors.description = "Enter a course description.";
    }

    if (course.chapters.length === 0) {
      nextErrors.chapters = "Add at least one chapter.";
    }

    course.chapters.forEach((chapter, chapterIndex) => {
      if (!chapter.title.trim()) {
        nextErrors[`chapter-${chapter.id}`] =
          `Enter a title for Chapter ${chapterIndex + 1}.`;
      }

      if (chapter.lessons.length === 0) {
        nextErrors[`lessons-${chapter.id}`] =
          `Add at least one lesson to Chapter ${chapterIndex + 1}.`;
      }

      chapter.lessons.forEach((lesson, lessonIndex) => {
        if (!lesson.title.trim()) {
          nextErrors[`lesson-${lesson.id}`] =
            `Enter a title for Lesson ${lessonIndex + 1} in Chapter ${chapterIndex + 1}.`;
        }

        if (!isValidHttpUrl(lesson.videoUrl)) {
          nextErrors[`video-${lesson.id}`] =
            "Enter a valid http:// or https:// URL.";
        }
      });
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handlePreview(event) {
    event.preventDefault();
    if (!validateForm()) {
      setMessage('Please fix the highlighted fields before previewing your course.');
      setMessageType('error');
      const firstError = document.querySelector('.builder-error');
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
      "Preview is ready. This course has not been saved to the server.",
    );
    setMessageType("success");
  }

  async function handleSaveAndPublish(event) {
    event.preventDefault();
    if (!validateForm()) {
      setMessage('Please fix the highlighted fields before publishing your course.');
      setMessageType('error');
      const firstError = document.querySelector('.builder-error');
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const payload = {
        title: course.title,
        description: course.description,
        category: course.category,
        level: course.level.toLowerCase(),
        status: 'published',
        chapters: course.chapters.map((chapter, chapterIndex) => ({
          title: chapter.title,
          description: chapter.description || '',
          order: chapterIndex + 1,
          lessons: chapter.lessons.map((lesson, lessonIndex) => ({
            title: lesson.title,
            description: lesson.description,
            videoUrl: lesson.videoUrl,
            durationMinutes: parseInt(lesson.durationMinutes, 10) || 0,
            order: lessonIndex + 1,
          })),
        })),
        quizzes: course.quizzes.map((q) => ({
          question: q.question,
          options: q.options,
          correct: q.correct,
        })),
      };

      await createCourse(payload);
      setMessage('Course successfully published to the backend database!');
      setMessageType('success');
    } catch (err) {
      setMessage(err.message || 'Failed to save course to the backend.');
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="student-page instructor-builder">
      <div className="builder-heading">
        <div>
          <p className="builder-eyebrow">INSTRUCTOR WORKSPACE</p>
          <h2>Create a course</h2>
          <p>
            Build a clear learning path by organizing your content into chapters, lessons, and quizzes.
          </p>
        </div>
        <span className="builder-draft-badge">
          {courseStatus === "published"
            ? "Published"
            : courseId
              ? "Saved draft"
              : "Local draft"}
        </span>
      </div>

      <div
        className="builder-progress-card"
        aria-label={`Course setup ${completion}% complete`}
      >
        <div className="builder-progress-copy">
          <div>
            <strong>Course setup</strong>
            <span>{completion}% complete</span>
          </div>
          <p>Complete the required fields to generate a preview or publish.</p>
        </div>
        <div
          className="builder-progress-track"
          role="progressbar"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={completion}
        >
          <span style={{ width: `${completion}%` }} />
        </div>
        <div className="builder-stat-row">
          <span>
            <strong>{course.chapters.length}</strong> chapters
          </span>
          <span>
            <strong>{lessonCount}</strong> lessons
          </span>
          <span>
            <strong>{course.quizzes.length}</strong> quiz questions
          </span>
          <span>
            <strong>{course.level}</strong> level
          </span>
        </div>
      </div>

      <form noValidate>
        {/* ÉTAPE 1 : Informations du cours */}
        <section className="builder-card">
          <div className="builder-card-heading">
            <span className="builder-step">01</span>
            <div>
              <h3>Course information</h3>
              <p>Give learners a clear idea of what they will learn.</p>
            </div>
          </div>

          <div className="builder-field">
            <label htmlFor="course-title">
              Course title <span aria-hidden="true">*</span>
            </label>
            <input
              id="course-title"
              value={course.title}
              onChange={(event) => updateCourse("title", event.target.value)}
              placeholder="e.g. Full-Stack Web Development"
              maxLength={100}
              aria-invalid={Boolean(errors.title)}
            />
            {errors.title && <p className="builder-error">{errors.title}</p>}
          </div>

          <div className="builder-field">
            <label htmlFor="course-description">
              Course description <span aria-hidden="true">*</span>
            </label>
            <textarea
              id="course-description"
              rows={4}
              value={course.description}
              onChange={(event) => updateCourse("description", event.target.value)}
              placeholder="Describe the skills students will gain."
              maxLength={1000}
            />
            {errors.description && <p className="builder-error">{errors.description}</p>}
          </div>

          <div className="builder-fields-row">
            <div className="builder-field">
              <label htmlFor="course-category">Category</label>
              <select
                id="course-category"
                value={course.category}
                onChange={(event) => updateCourse("category", event.target.value)}
              >
                <option>Web Development</option>
                <option>Programming</option>
                <option>Data Science</option>
                <option>Artificial Intelligence</option>
                <option>Cybersecurity</option>
                <option>General</option>
                <option>Other</option>
              </select>
            </div>
            <div className="builder-field">
              <label htmlFor="course-level">Difficulty level</label>
              <select
                id="course-level"
                value={course.level}
                onChange={(event) => updateCourse("level", event.target.value)}
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>
          </div>
        </section>

        {/* ÉTAPE 2 : Curriculum (Chapitres & Leçons) */}
        <section className="builder-curriculum">
          <div className="builder-section-heading">
            <div>
              <p className="builder-eyebrow">02 · LEARNING PATH</p>
              <h3>Course curriculum</h3>
              <p>Arrange your course into chapters, then add lessons to each chapter.</p>
            </div>
            <button className="builder-secondary-button" type="button" onClick={addChapter}>
              + Add chapter
            </button>
          </div>

          {course.chapters.map((chapter, chapterIndex) => (
            <article className="builder-chapter" key={chapter.id}>
              <div className="builder-chapter-heading">
                <span className="builder-number">{String(chapterIndex + 1).padStart(2, "0")}</span>
                <div className="builder-chapter-title">
                  <label htmlFor={`chapter-${chapter.id}`}>Chapter {chapterIndex + 1} title *</label>
                  <input
                    id={`chapter-${chapter.id}`}
                    value={chapter.title}
                    onChange={(event) => updateChapter(chapter.id, "title", event.target.value)}
                    placeholder="e.g. Introduction"
                  />
                </div>
                <button className="builder-remove-button" type="button" onClick={() => removeChapter(chapter.id)}>
                  Remove
                </button>
              </div>

              <div className="builder-lessons">
                {chapter.lessons.map((lesson, lessonIndex) => (
                  <div className="builder-lesson" key={lesson.id}>
                    <div className="builder-lesson-fields">
                      <label>Lesson {lessonIndex + 1} title *</label>
                      <input
                        value={lesson.title}
                        onChange={(event) => updateLesson(chapter.id, lesson.id, "title", event.target.value)}
                        placeholder="e.g. What is a component?"
                      />
                      <label>Video or resource URL</label>
                      <input
                        type="url"
                        value={lesson.videoUrl}
                        onChange={(event) => updateLesson(chapter.id, lesson.id, "videoUrl", event.target.value)}
                        placeholder="https://youtube.com/..."
                      />
                    </div>
                    <button className="builder-remove-button" type="button" onClick={() => removeLesson(chapter.id, lesson.id)}>
                      Remove
                    </button>
                  </div>
                ))}
                <button className="builder-add-lesson" type="button" onClick={() => addLesson(chapter.id)}>
                  + Add lesson to this chapter
                </button>
              </div>
            </article>
          ))}
        </section>

        {/* ÉTAPE 3 : Configuration du Quiz (Nouveau pour Semaine 4) */}
        <section className="builder-card" style={{ marginTop: '2rem', padding: '1.5rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <div className="builder-card-heading">
            <span className="builder-step">03</span>
            <div>
              <h3>Module Assessment Quiz</h3>
              <p>Add multiple-choice questions to test learners before certification.</p>
            </div>
          </div>

          {course.quizzes.map((quiz, qIndex) => (
            <div key={quiz.id} style={{ marginTop: '1.5rem', padding: '1rem', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <strong>Question {qIndex + 1}</strong>
                <button type="button" onClick={() => removeQuizQuestion(quiz.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Remove Question
                </button>
              </div>

              <input
                type="text"
                placeholder="Enter quiz question..."
                value={quiz.question}
                onChange={(e) => updateQuiz(quiz.id, "question", e.target.value)}
                style={{ width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
              />

              <label style={{ fontSize: '0.9rem', color: '#64748b' }}>Options (Select the radio button for the correct answer):</label>
              {quiz.options.map((opt, oIndex) => (
                <div key={oIndex} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                  <input
                    type="radio"
                    name={`correct-${quiz.id}`}
                    checked={quiz.correct === oIndex}
                    onChange={() => updateQuiz(quiz.id, "correct", oIndex)}
                  />
                  <input
                    type="text"
                    placeholder={`Option ${oIndex + 1}`}
                    value={opt}
                    onChange={(e) => updateQuizOption(quiz.id, oIndex, e.target.value)}
                    style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              ))}
            </div>
          ))}

          <button type="button" onClick={addQuizQuestion} style={{ marginTop: '1rem', background: '#4f46e5', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            + Add Quiz Question
          </button>
        </section>

        {message && (
          <p className={`builder-message builder-message-${messageType}`} role={messageType === "error" ? "alert" : "status"}>
            {message}
          </p>
        )}

        <div className="builder-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem', marginBottom: '2rem' }}>
          <button type="button" onClick={handlePreview} className="builder-secondary-button">
            Preview course
          </button>
          <button type="button" onClick={handleSaveAndPublish} className="builder-primary-button" disabled={saving}>
            {saving ? 'Publishing...' : 'Save & Publish Course →'}
          </button>
        </div>
      </form>
    </section>
  );
}