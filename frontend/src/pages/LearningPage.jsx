
import { useEffect, useState } from 'react';

const API =
  `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

function getProgressKey(courseId) {
  return `axlero-progress-${courseId}`;
}

function getSavedProgress(courseId) {
  try {
    return JSON.parse(
      localStorage.getItem(getProgressKey(courseId)) || '[]'
    );
  } catch {
    return [];
  }
}

function getLessonId(lesson) {
  return String(lesson?._id || lesson?.id || '');
}

function getCourseLessons(course) {
  if (Array.isArray(course?.chapters)) {
    return course.chapters.flatMap((chapter) =>
      (chapter.lessons || []).map((lesson) => ({
        ...lesson,
        chapterTitle: chapter.title,
      }))
    );
  }

  return Array.isArray(course?.lessons)
    ? course.lessons
    : [];
}

export default function LearningPage({ course, enrollment, onBack }) {
  const lessons = getCourseLessons(course);

  const courseId = course?._id || course?.id || course?.courseId;
  const enrollmentId = enrollment?._id || enrollment?.id;

  const [currentLesson, setCurrentLesson] = useState(0);

  const [completedLessons, setCompletedLessons] = useState(() =>
    getSavedProgress(courseId)
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (courseId) {
      localStorage.setItem(
        getProgressKey(courseId),
        JSON.stringify(completedLessons)
      );
    }
  }, [courseId, completedLessons]);

  const lesson = lessons[currentLesson];

  const validCompletedLessons = completedLessons.filter((id) =>
    lessons.some((item) => getLessonId(item) === id)
  );

  const progress = lessons.length
    ? Math.round((validCompletedLessons.length / lessons.length) * 100)
    : 0;

  async function markComplete() {
    if (!lesson || saving) return;

    const lessonId = getLessonId(lesson);

    if (!lessonId) {
      setError('Lesson ID not found.');
      return;
    }

    if (completedLessons.includes(lessonId)) return;

    const updatedLessons = [...completedLessons, lessonId];

    setSaving(true);
    setError('');
    setMessage('');

    try {
      // Mock mode: save progress locally
      if (USE_MOCK) {
        setCompletedLessons(updatedLessons);
        setMessage('Lesson progress saved successfully!');
        return;
      }

      // Backend mode: save progress through API
      if (!enrollmentId) {
        throw new Error('Enrollment ID not found. Please refresh.');
      }

      const token = sessionStorage.getItem('axleroToken');

      const response = await fetch(
        `${API}/enrollments/${enrollmentId}/progress`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            completedLessonIds: updatedLessons,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to save lesson progress.');
      }

      setCompletedLessons(updatedLessons);
      setMessage('Lesson progress saved successfully!');
    } catch (err) {
      setError(err.message || 'Unable to update progress.');
    } finally {
      setSaving(false);
    }
  }

  if (!course) {
    return (
      <section className="student-page">
        <p>Course not found.</p>
        <button type="button" onClick={onBack}>
          Back to My Learning
        </button>
      </section>
    );
  }

  if (lessons.length === 0) {
    return (
      <section className="student-page">
        <button type="button" onClick={onBack}>
          Back to My Learning
        </button>
        <h2>{course.title}</h2>
        <p>No lessons are available for this course yet.</p>
      </section>
    );
  }

  return (
    <section className="student-page">
      <button type="button" onClick={onBack}>
        Back to My Learning
      </button>

      <h2>{course.title || 'Course Learning'}</h2>

      <p>Lesson {currentLesson + 1} of {lessons.length}</p>

      {lesson.chapterTitle && <p>Chapter: {lesson.chapterTitle}</p>}

      <h3>{lesson.title || lesson.name || 'Untitled Lesson'}</h3>

      <p>
        {lesson.content || lesson.description || 'No lesson content available.'}
      </p>

      <p>Course Progress: <strong>{progress}%</strong></p>

      <progress value={progress} max="100" />

      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}

      <div className="lesson-actions">
        <button
          type="button"
          onClick={() => setCurrentLesson((previous) => Math.max(0, previous - 1))}
          disabled={currentLesson === 0 || saving}
        >
          Previous Lesson
        </button>

        <button
          type="button"
          onClick={markComplete}
          disabled={completedLessons.includes(getLessonId(lesson)) || saving}
        >
          {saving
            ? 'Saving...'
            : completedLessons.includes(getLessonId(lesson))
              ? 'Lesson Completed'
              : 'Mark as Complete'}
        </button>

        <button
          type="button"
          onClick={() => setCurrentLesson((previous) =>
            Math.min(lessons.length - 1, previous + 1)
          )}
          disabled={currentLesson === lessons.length - 1 || saving}
        >
          Next Lesson
        </button>
      </div>

      {progress === 100 && (
        <p role="status">Congratulations! You completed all lessons.</p>
      )}
    </section>
  );
}
