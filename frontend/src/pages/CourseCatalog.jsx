import { useEffect, useState } from 'react';
import { getCourses, enrollInCourse } from '../api/courseApi';

export default function CourseCatalog({ onSelectCourse }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [enrollingCourse, setEnrollingCourse] = useState('');

  useEffect(() => {
    async function fetchCourses() {
      try {
        setError('');

        const data = await getCourses();

        setCourses(data.courses || []);
      } catch (err) {
        setError(err.message || 'Unable to connect to the server.');
      } finally {
        setLoading(false);
      }
    }

    fetchCourses();
  }, []);

  async function handleEnroll(courseId) {
    setMessage('');

    const token = sessionStorage.getItem('axleroToken');

    if (!token) {
      setMessage('Please log in as a student before enrolling.');
      return;
    }

    setEnrollingCourse(courseId);

    try {
      const data = await enrollInCourse(courseId);

      setMessage(data.message || 'Successfully enrolled in the course!');
    } catch (err) {
      setMessage(err.message || 'Unable to enroll. Please try again.');
    } finally {
      setEnrollingCourse('');
    }
  }

  return (
    <section className="student-page">
      <h2>Explore Courses</h2>
      <p>Discover courses and continue your learning journey.</p>

      {message && <p role="status">{message}</p>}

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

            <div className="course-actions">
              <button
                type="button"
                onClick={() => onSelectCourse?.(course)}
              >
                View Course
              </button>

              <button
                type="button"
                onClick={() => handleEnroll(course._id)}
                disabled={enrollingCourse === course._id}
              >
                {enrollingCourse === course._id
                  ? 'Enrolling...'
                  : 'Enroll Now'}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
