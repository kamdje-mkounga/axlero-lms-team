
import { useEffect, useState } from 'react';

const API = 'http://localhost:5000/api';

export default function StudentDashboard({ onSelectCourse }) {
  const [enrollments, setEnrollments] = useState([]);
  const [lessonsByCourse, setLessonsByCourse] = useState({});
  const [progressByCourse, setProgressByCourse] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeCourse, setActiveCourse] = useState('');
  const [busyLesson, setBusyLesson] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function apiRequest(path, options = {}) {
    const token = sessionStorage.getItem('axleroToken');

    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchMyLearning() {
      const token = sessionStorage.getItem('axleroToken');

      if (!token) {
        setError('Please log in to view your learning dashboard.');
        setLoading(false);
        return;
      }

      try {
        const data = await apiRequest('/enrollments/my-learning');

        if (!cancelled) {
          setEnrollments(data.enrollments || []);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchMyLearning();

    return () => {
      cancelled = true;
    };
  }, []);

  async function toggleLessons(courseId) {
    if (activeCourse === courseId) {
      setActiveCourse('');
      return;
    }

    setActiveCourse(courseId);
    setError('');
    setMessage('');

    if (lessonsByCourse[courseId]) return;

    try {
      const [lessonData, progressData] = await Promise.all([
        apiRequest(`/courses/${courseId}/lessons`),
        apiRequest(`/progress/${courseId}`),
      ]);

      setLessonsByCourse((prev) => ({
        ...prev,
        [courseId]: lessonData.lessons || [],
      }));

      setProgressByCourse((prev) => ({
        ...prev,
        [courseId]: {
          completedLessons: (progressData.completedLessons || []).map(
            (item) => String(item?._id || item)
          ),
          totalLessons: progressData.totalLessons ?? 0,
          completedCount: progressData.completedCount ?? 0,
          percentage: progressData.percentage ?? 0,
        },
      }));
    } catch (err) {
      setError(err.message);
    }
  }

  async function completeLesson(courseId, lessonId) {
    setBusyLesson(lessonId);
    setError('');
    setMessage('');

    try {
      await apiRequest(
        `/progress/${courseId}/complete/${lessonId}`,
        { method: 'POST' }
      );

      const [lessonData, progressData] = await Promise.all([
        apiRequest(`/courses/${courseId}/lessons`),
        apiRequest(`/progress/${courseId}`),
      ]);

      setLessonsByCourse((prev) => ({
        ...prev,
        [courseId]: lessonData.lessons || [],
      }));

      setProgressByCourse((prev) => ({
        ...prev,
        [courseId]: {
          completedLessons: (progressData.completedLessons || []).map(
            (item) => String(item?._id || item)
          ),
          totalLessons: progressData.totalLessons ?? 0,
          completedCount: progressData.completedCount ?? 0,
          percentage: progressData.percentage ?? 0,
        },
      }));

      setMessage('Lesson marked as completed!');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyLesson('');
    }
  }

  return (
    <section className="student-page">
      <h2>My Learning Dashboard</h2>
      <p>View your enrolled courses and continue learning.</p>

      {loading && <p>Loading your courses...</p>}
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}

      {!loading && !error && enrollments.length === 0 && (
        <p>You haven't enrolled in any courses yet.</p>
      )}

      <div className="student-course-grid">
        {enrollments.map((enrollment) => {
          const course = enrollment.course;
          if (!course) return null;

          const lessons = lessonsByCourse[course._id] || [];
          const progress = progressByCourse[course._id];
          const completed = progress?.completedLessons || [];

          return (
            <article className="student-course-card" key={enrollment._id}>
              <h3>{course.title}</h3>
              <p>{course.description || 'No description available.'}</p>
              <p>Category: {course.category || 'General'}</p>

              <button
                type="button"
                onClick={() => onSelectCourse?.(course)}
              >
                Open Course Details
              </button>

              <button
                type="button"
                onClick={() => toggleLessons(course._id)}
              >
                {activeCourse === course._id ? 'Hide Lessons' : 'View Lessons & Progress'}
              </button>

              {activeCourse === course._id && (
                <div className="lesson-panel">
                  {progress && (
                    <>
                      <h4>Course Progress: {progress.percentage}%</h4>
                      <progress
                        value={progress.percentage}
                        max="100"
                        style={{ width: '100%', height: '14px' }}
                      />
                      <p>
                        {progress.completedCount} of {progress.totalLessons} lessons completed
                      </p>
                    </>
                  )}

                  {lessons.length === 0 && (
                    <p>No lessons available yet.</p>
                  )}

                  {lessons.map((lesson, index) => {
                    const isCompleted = completed.includes(String(lesson._id));

                    return (
                      <article className="lesson-item" key={lesson._id}>
                        <h4>{index + 1}. {lesson.title}</h4>

                        {lesson.type === 'video' && lesson.videoUrl ? (
                          <a
                            href={lesson.videoUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open Video
                          </a>
                        ) : (
                          <p>{lesson.content || 'No lesson content available.'}</p>
                        )}

                        <button
                          type="button"
                          disabled={isCompleted || busyLesson === lesson._id}
                          onClick={() => completeLesson(course._id, lesson._id)}
                        >
                          {isCompleted
                            ? 'Completed'
                            : busyLesson === lesson._id
                              ? 'Saving...'
                              : 'Mark as Completed'}
                        </button>
                      </article>
                    );
                  })}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
