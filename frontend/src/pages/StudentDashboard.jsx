
import { useEffect, useState } from 'react';
import { getMyEnrollments } from '../api/courseApi';

export default function StudentDashboard({ onSelectCourse }) {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadEnrollments() {
      setLoading(true);
      setError('');

      try {
        const data = await getMyEnrollments();

        if (active) {
          setEnrollments(
            Array.isArray(data) ? data : []
          );
        }
      } catch (err) {
        if (active) {
          setError(
            err.message || 'Unable to load your enrolled courses.'
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadEnrollments();

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="student-page">
      <h2>My Learning Dashboard</h2>

      <p>
        View your enrolled courses and continue learning.
      </p>

      {loading && (
        <p role="status">Loading your courses...</p>
      )}

      {error && (
        <p role="alert">{error}</p>
      )}

      {!loading && !error && enrollments.length === 0 && (
        <p>
          You haven't enrolled in any courses yet.
          Visit the Course Catalog to explore courses.
        </p>
      )}

      {!loading && !error && enrollments.length > 0 && (
        <div className="student-course-grid">
          {enrollments.map((enrollment, index) => {
            const course = enrollment.course;

            if (!course) return null;
            const courseId =
  course._id || course.id || enrollment.courseId || course.title;

const savedLessons = (() => {
  try {
    return JSON.parse(
      localStorage.getItem(`axlero-progress-${courseId}`) || '[]'
    );
  } catch {
    return [];
  }
})();

const localProgress = Math.round(
  (savedLessons.length / 4) * 100
);

const progress = Math.max(
  Number(enrollment.progress) || 0,
  localProgress
);

            const safeProgress = Math.min(
              100,
              Math.max(0, progress)
            );

            return (
              <article
                className="student-course-card"
                key={
                  enrollment._id ||
                  enrollment.courseId ||
                  course._id ||
                  index
                }
              >
                <h3>{course.title || 'Untitled Course'}</h3>

                <p>
                  {course.description ||
                    'No description available.'}
                </p>

                <p>
                  Category: {course.category || 'General'}
                </p>

                <h4>Course Progress: {safeProgress}%</h4>

                <progress
                  value={safeProgress}
                  max="100"
                  aria-label={`Course progress: ${safeProgress}%`}
                  style={{
                    width: '100%',
                    height: '14px',
                  }}
                />

                <p>
                  {safeProgress === 100
                    ? 'Course completed!'
                    : 'Keep learning to complete this course.'}
                </p>

                <button
                  type="button"
                  onClick={() => onSelectCourse?.(course)}
                >
                  Continue Learning
                </button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
