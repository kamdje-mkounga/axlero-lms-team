
import { useEffect, useState } from 'react';
import {
  getCourseById,
  enrollInCourse,
  getMyEnrollments,
} from '../api/courseApi';

export default function CourseDetail({
  course,
  onBack,
  onContinue,
}) {
  const [courseDetails, setCourseDetails] = useState(course || null);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!course?._id) return;

    let active = true;

    async function loadCourse() {
      setLoading(true);
      setError('');

      try {
        const [details, enrollments] = await Promise.all([
          getCourseById(course._id),
          getMyEnrollments(),
        ]);

        if (active) {
          setCourseDetails(details);

          setEnrolled(
            enrollments.some((item) => {
              const enrolledCourseId =
                item.courseId || item.course?._id;

              return enrolledCourseId === course._id;
            })
          );
        }
      } catch (err) {
        if (active) {
          setError(
            err.message || 'Unable to load course details.'
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadCourse();

    return () => {
      active = false;
    };
  }, [course?._id]);

  async function handleEnroll() {
    if (!courseDetails?._id || enrolling) return;

    setEnrolling(true);
    setError('');
    setMessage('');

    try {
      const result = await enrollInCourse(courseDetails._id);

      setEnrolled(true);
      setMessage(
        result.message || 'Enrollment successful!'
      );
    } catch (err) {
      setError(
        err.message || 'Unable to enroll in this course.'
      );
    } finally {
      setEnrolling(false);
    }
  }

  const selectedCourse = courseDetails || course;

  if (!selectedCourse) {
    return (
      <section className="student-page">
        <p>No course selected.</p>

        <button type="button" onClick={onBack}>
          Back to Courses
        </button>
      </section>
    );
  }

  const instructor =
    typeof selectedCourse.instructor === 'string'
      ? selectedCourse.instructor
      : selectedCourse.instructor?.name || 'Not specified';

  return (
    <section className="student-page">
      <button type="button" onClick={onBack}>
        Back to Courses
      </button>

      <h2>{selectedCourse.title}</h2>

      <p>
        {selectedCourse.description ||
          'No description available.'}
      </p>

      <p>
        Category: {selectedCourse.category || 'General'}
      </p>

      <p>Instructor: {instructor}</p>

      {selectedCourse.duration && (
        <p>Duration: {selectedCourse.duration}</p>
      )}

      {loading && (
        <p role="status">Loading course details...</p>
      )}

      {error && <p role="alert">{error}</p>}

      
{enrolled ? (
        
<button
  type="button"
  onClick={() => {
    console.log('Continue button clicked');
    onContinue();
  }}
  disabled={loading}
>
  Continue Learning
</button>

      ) : (
        <button
          type="button"
          onClick={handleEnroll}
          disabled={loading || enrolling}
        >
          {enrolling ? 'Enrolling...' : 'Enroll Now'}
        </button>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}
