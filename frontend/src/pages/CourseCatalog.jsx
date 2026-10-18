
import { useEffect, useState } from 'react';

const API = 'http://localhost:5000/api';

export default function CourseCatalog({ onSelectCourse }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchCourses() {
      try {
        const response = await fetch(`${API}/courses`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Unable to load courses');
        }

        setCourses(data.courses || []);
      } catch (err) {
        setError(err.message || 'Unable to connect to the server.');
      } finally {
        setLoading(false);
      }
    }

    fetchCourses();
  }, []);

  return (
    <section className="student-page">
      <h2>Explore Courses</h2>
      <p>Discover courses and continue your learning journey.</p>

      {loading && <p>Loading courses...</p>}
      {error && <p role="alert">{error}</p>}

      {!loading && !error && courses.length === 0 && (
        <p>No courses available yet.</p>
      )}

      <div className="student-course-grid">
        {courses.map((course) => (
          <article className="student-course-card" key={course._id}>
            <span className="course-category">
              {course.category || 'General'}
            </span>

            <h3>{course.title}</h3>
            <p>{course.description || 'No description available.'}</p>

            {course.instructor?.name && (
              <p>Instructor: {course.instructor.name}</p>
            )}

            <button
              type="button"
              onClick={() => onSelectCourse?.(course)}
            >
              View Course
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
