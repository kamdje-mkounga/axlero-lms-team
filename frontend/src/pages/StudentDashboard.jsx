
import { useEffect, useState } from 'react';

const API = 'http://localhost:5000/api';

export default function StudentDashboard({ onSelectCourse }) {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = sessionStorage.getItem('axleroToken');

    if (!token) {
      setError('Please log in to view your learning dashboard.');
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function fetchMyLearning() {
      try {
        const response = await fetch(`${API}/enrollments/my-learning`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Unable to load your courses.');
        }

        setEnrollments(data.enrollments || []);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Unable to load your courses.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchMyLearning();

    return () => controller.abort();
  }, []);

  return (
    <section className="student-page">
      <h2>My Learning Dashboard</h2>
      <p>View your enrolled courses and continue learning.</p>

      {loading && <p>Loading your courses...</p>}
      {error && <p role="alert">{error}</p>}

      {!loading && !error && enrollments.length === 0 && (
        <p>You haven't enrolled in any courses yet.</p>
      )}

      <div className="student-course-grid">
        {enrollments.map((enrollment) => {
          const course = enrollment.course;

          if (!course) return null;

          return (
            <article className="student-course-card" key={enrollment._id}>
              <h3>{course.title}</h3>
              <p>{course.description || 'No description available.'}</p>
              <p>Category: {course.category || 'General'}</p>

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
    </section>
  );
}
