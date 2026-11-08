import { useMemo, useState } from "react";
import { createCourse, updateCourse as updateCourseApi } from "../api/courseApi";

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

function mapCourseToApi(course, status = "draft") {
  return {
    title: course.title.trim(),
    description: course.description.trim(),
    category: course.category,
    level: course.level.toLowerCase(),
    status,

    chapters: course.chapters.map((chapter, chapterIndex) => ({
      title: chapter.title.trim(),
      description: (chapter.description || "").trim(),
      order: chapterIndex + 1,

      lessons: chapter.lessons.map((lesson, lessonIndex) => ({
        title: lesson.title.trim(),
        content: lesson.description.trim(),
        videoUrl: lesson.videoUrl.trim(),
        durationMinutes: Math.max(0, parseInt(lesson.durationMinutes, 10) || 0),
        order: lessonIndex + 1,
      })),
    })),
  };
}

const countLessons = (chapters) =>
  chapters.reduce((total, chapter) => total + chapter.lessons.length, 0);

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
  });
  const [courseId, setCourseId] = useState(null);
  const [courseStatus, setCourseStatus] = useState("draft");
  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [isSaving, setIsSaving] = useState(false);

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
                lesson.id === lessonId ? { ...lesson, [field]: value } : lesson,
              ),
            }
          : chapter,
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
          : chapter,
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
          : item,
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

  function validateCourse() {
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

    if (Object.keys(nextErrors).length > 0) {
      setMessage("Please fix the highlighted fields before continuing.");
      setMessageType("error");

      const firstError = document.querySelector(".builder-error");
      firstError?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      return false;
    }

    return true;
  }

  function handleSubmit(event) {
    event.preventDefault();

    setPreview(null);

    if (!validateCourse()) {
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

  function handleReset() {
    setCourse({
      title: "",
      description: "",
      category: "Web Development",
      level: "Beginner",
      chapters: [createChapter()],
    });
    setCourseId(null);
    setCourseStatus("draft");
    setErrors({});
    setPreview(null);
    setMessage("Ready to create a new course.");
    setMessageType("info");
  }

  async function handleSave(targetStatus = "draft") {
    if (isSaving) return;

    if (!validateCourse()) {
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      const courseData = mapCourseToApi(course, targetStatus);
      let result;

      if (courseId) {
        result = await updateCourseApi(courseId, courseData);
        setCourseStatus(targetStatus);
        setMessage(
          targetStatus === "published"
            ? "Course published successfully! It is now live in the catalog."
            : "Course draft updated successfully!"
        );
      } else {
        result = await createCourse(courseData);
        const savedId = result?.id || result?._id;
        if (savedId) {
          setCourseId(savedId);
        }
        setCourseStatus(targetStatus);
        setMessage(
          targetStatus === "published"
            ? "Course created and published successfully! It is now live in the catalog."
            : "Course draft saved successfully!"
        );
      }

      setMessageType("success");
    } catch (error) {
      setMessage(
        error.message || "Unable to save the course. Please try again.",
      );
      setMessageType("error");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="student-page instructor-builder">
      <div className="builder-heading">
        <div>
          <p className="builder-eyebrow">INSTRUCTOR WORKSPACE</p>
          <h2>Create a course</h2>
          <p>
            Build a clear learning path by organizing your content into chapters
            and lessons.
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
          <p>Complete the required fields to generate a preview.</p>
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
            <strong>{course.level}</strong> level
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
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
              aria-describedby={
                errors.title ? "course-title-error" : "course-title-hint"
              }
            />
            {errors.title ? (
              <p className="builder-error" id="course-title-error">
                {errors.title}
              </p>
            ) : (
              <p className="builder-hint" id="course-title-hint">
                {course.title.length}/100 characters
              </p>
            )}
          </div>

          <div className="builder-field">
            <label htmlFor="course-description">
              Course description <span aria-hidden="true">*</span>
            </label>
            <textarea
              id="course-description"
              rows={4}
              value={course.description}
              onChange={(event) =>
                updateCourse("description", event.target.value)
              }
              placeholder="Describe the skills students will gain and the topics covered."
              maxLength={1000}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={
                errors.description
                  ? "course-description-error"
                  : "course-description-hint"
              }
            />
            {errors.description ? (
              <p className="builder-error" id="course-description-error">
                {errors.description}
              </p>
            ) : (
              <p className="builder-hint" id="course-description-hint">
                {course.description.length}/1000 characters
              </p>
            )}
          </div>

          <div className="builder-fields-row">
            <div className="builder-field">
              <label htmlFor="course-category">Category</label>
              <select
                id="course-category"
                value={course.category}
                onChange={(event) =>
                  updateCourse("category", event.target.value)
                }
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

        <section className="builder-curriculum">
          <div className="builder-section-heading">
            <div>
              <p className="builder-eyebrow">02 · LEARNING PATH</p>
              <h3>Course curriculum</h3>
              <p>
                Arrange your course into chapters, then add lessons to each
                chapter.
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
            <p className="builder-error" role="alert">
              {errors.chapters}
            </p>
          )}

          {course.chapters.length === 0 && (
            <div className="builder-empty-state">
              <strong>No chapters yet</strong>
              <p>Add your first chapter to start building the curriculum.</p>
              <button
                className="builder-secondary-button"
                type="button"
                onClick={addChapter}
              >
                + Add first chapter
              </button>
            </div>
          )}

          {course.chapters.map((chapter, chapterIndex) => (
            <article className="builder-chapter" key={chapter.id}>
              <div className="builder-chapter-heading">
                <span className="builder-number">
                  {String(chapterIndex + 1).padStart(2, "0")}
                </span>
                <div className="builder-chapter-title">
                  <label htmlFor={`chapter-${chapter.id}`}>
                    Chapter {chapterIndex + 1} title{" "}
                    <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id={`chapter-${chapter.id}`}
                    value={chapter.title}
                    onChange={(event) =>
                      updateChapter(chapter.id, "title", event.target.value)
                    }
                    placeholder="e.g. Introduction to React"
                    aria-invalid={Boolean(errors[`chapter-${chapter.id}`])}
                  />
                  {errors[`chapter-${chapter.id}`] && (
                    <p className="builder-error">
                      {errors[`chapter-${chapter.id}`]}
                    </p>
                  )}

                  <label htmlFor={`chapter-desc-${chapter.id}`}>
                    Chapter description{" "}
                    <span className="builder-optional">(optional)</span>
                  </label>
                  <textarea
                    id={`chapter-desc-${chapter.id}`}
                    rows={2}
                    value={chapter.description || ""}
                    onChange={(event) =>
                      updateChapter(
                        chapter.id,
                        "description",
                        event.target.value,
                      )
                    }
                    placeholder="Briefly describe what this chapter covers."
                  />
                </div>
                <button
                  className="builder-remove-button"
                  type="button"
                  onClick={() => removeChapter(chapter.id)}
                  aria-label={`Remove chapter ${chapterIndex + 1}`}
                >
                  Remove
                </button>
              </div>

              <div className="builder-chapter-meta">
                {chapter.lessons.length}{" "}
                {chapter.lessons.length === 1 ? "lesson" : "lessons"}
              </div>

              {errors[`lessons-${chapter.id}`] && (
                <p className="builder-error">
                  {errors[`lessons-${chapter.id}`]}
                </p>
              )}

              <div className="builder-lessons">
                {chapter.lessons.map((lesson, lessonIndex) => (
                  <div className="builder-lesson" key={lesson.id}>
                    <span className="builder-lesson-icon" aria-hidden="true">
                      ▶
                    </span>
                    <div className="builder-lesson-fields">
                      <label htmlFor={`lesson-${lesson.id}`}>
                        Lesson {lessonIndex + 1} title{" "}
                        <span aria-hidden="true">*</span>
                      </label>
                      <input
                        id={`lesson-${lesson.id}`}
                        value={lesson.title}
                        onChange={(event) =>
                          updateLesson(
                            chapter.id,
                            lesson.id,
                            "title",
                            event.target.value,
                          )
                        }
                        placeholder="e.g. What is a component?"
                        aria-invalid={Boolean(errors[`lesson-${lesson.id}`])}
                      />
                      {errors[`lesson-${lesson.id}`] && (
                        <p className="builder-error">
                          {errors[`lesson-${lesson.id}`]}
                        </p>
                      )}

                      <label htmlFor={`lesson-description-${lesson.id}`}>
                        Lesson description{" "}
                        <span className="builder-optional">(optional)</span>
                      </label>
                      <textarea
                        id={`lesson-description-${lesson.id}`}
                        rows={2}
                        value={lesson.description}
                        onChange={(event) =>
                          updateLesson(
                            chapter.id,
                            lesson.id,
                            "description",
                            event.target.value,
                          )
                        }
                        placeholder="What will this lesson cover?"
                      />

                      <label htmlFor={`lesson-video-${lesson.id}`}>
                        Video or resource URL{" "}
                        <span className="builder-optional">(optional)</span>
                      </label>
                      <input
                        id={`lesson-video-${lesson.id}`}
                        type="url"
                        value={lesson.videoUrl}
                        onChange={(event) =>
                          updateLesson(
                            chapter.id,
                            lesson.id,
                            "videoUrl",
                            event.target.value,
                          )
                        }
                        placeholder="https://example.com/lesson"
                        aria-invalid={Boolean(errors[`video-${lesson.id}`])}
                      />
                      {errors[`video-${lesson.id}`] && (
                        <p className="builder-error">
                          {errors[`video-${lesson.id}`]}
                        </p>
                      )}

                      <label htmlFor={`lesson-duration-${lesson.id}`}>
                        Duration in minutes{" "}
                        <span className="builder-optional">(optional)</span>
                      </label>
                      <input
                        id={`lesson-duration-${lesson.id}`}
                        type="number"
                        min="0"
                        value={lesson.durationMinutes || ""}
                        onChange={(event) =>
                          updateLesson(
                            chapter.id,
                            lesson.id,
                            "durationMinutes",
                            event.target.value,
                          )
                        }
                        placeholder="e.g. 15"
                      />
                    </div>
                    <button
                      className="builder-remove-button"
                      type="button"
                      onClick={() => removeLesson(chapter.id, lesson.id)}
                      aria-label={`Remove lesson ${lessonIndex + 1} from chapter ${chapterIndex + 1}`}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  className="builder-add-lesson"
                  type="button"
                  onClick={() => addLesson(chapter.id)}
                >
                  + Add lesson to this chapter
                </button>
              </div>
            </article>
          ))}
        </section>

        {message && (
          <p
            className={`builder-message builder-message-${messageType}`}
            role={messageType === "error" ? "alert" : "status"}
          >
            {message}
          </p>
        )}

        <div className="builder-actions">
          <p className="builder-actions-note">
            {courseId
              ? `Course is saved (ID: ${courseId}). You can update draft, publish, or start a new course.`
              : "Preview your course, save it as a draft, or publish directly."}
          </p>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
            <button
              type="button"
              className="builder-primary-button"
              onClick={() => handleSave("published")}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Publish Course"}
            </button>

            <button
              type="button"
              className="builder-secondary-button"
              onClick={() => handleSave("draft")}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : courseId ? "Update Draft" : "Save Draft"}
            </button>

            <button
              type="submit"
              className="builder-secondary-button"
              disabled={isSaving}
            >
              Preview course <span aria-hidden="true">→</span>
            </button>

            {courseId && (
              <button
                type="button"
                className="builder-secondary-button"
                onClick={handleReset}
                disabled={isSaving}
              >
                + Create Another Course
              </button>
            )}

            {courseStatus === "published" && onNavigateToCatalog && (
              <button
                type="button"
                className="builder-secondary-button"
                onClick={onNavigateToCatalog}
              >
                View in Catalog ↗
              </button>
            )}
          </div>
        </div>
      </form>

      {preview && (
        <section className="builder-preview" aria-labelledby="preview-title">
          <div className="builder-preview-topline">
            <div>
              <p className="builder-eyebrow">03 · STUDENT VIEW</p>
              <h3 id="preview-title">Course preview</h3>
              <p>This is how your course outline will appear to learners.</p>
            </div>
            <span className="builder-preview-badge">Preview only</span>
          </div>

          <article className="builder-preview-hero">
            <span className="course-category">{preview.category}</span>
            <h4>{preview.title}</h4>
            <p>{preview.description}</p>
            <div className="builder-preview-stats">
              <span>{preview.level}</span>
              <span>{preview.chapters.length} chapters</span>
              <span>{countLessons(preview.chapters)} lessons</span>
            </div>
          </article>

          <div className="builder-preview-curriculum">
            <h4>Course content</h4>
            {preview.chapters.map((chapter, index) => (
              <section className="preview-chapter" key={chapter.id}>
                <div className="preview-chapter-heading">
                  <span className="builder-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h5>{chapter.title}</h5>
                    {chapter.description && (
                      <p style={{ margin: "2px 0 4px", color: "#667085", fontSize: "0.85rem" }}>
                        {chapter.description}
                      </p>
                    )}
                    <p>
                      {chapter.lessons.length}{" "}
                      {chapter.lessons.length === 1 ? "lesson" : "lessons"}
                    </p>
                  </div>
                </div>
                <ul>
                  {chapter.lessons.map((lesson, lessonIndex) => (
                    <li key={lesson.id}>
                      <span className="builder-preview-play" aria-hidden="true">
                        ▶
                      </span>
                      <div>
                        <strong>{lesson.title}</strong>
                        {lesson.description && <p>{lesson.description}</p>}
                        {lesson.durationMinutes && (
                          <span style={{ fontSize: "0.8rem", color: "#667085", display: "inline-block", marginRight: "10px" }}>
                            ⏱ {lesson.durationMinutes} min
                          </span>
                        )}
                        {lesson.videoUrl && (
                          <a
                            href={lesson.videoUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                          >
                            Open lesson resource ↗
                          </a>
                        )}
                      </div>
                      <span className="builder-preview-lesson-number">
                        {String(lessonIndex + 1).padStart(2, "0")}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          <p className="builder-preview-note">
            <strong>Draft notice:</strong> This preview is stored only in the
            current page state. It is not saved to the server and will be lost
            if you reload or leave this page.
          </p>
        </section>
      )}
    </section>
  );
}
