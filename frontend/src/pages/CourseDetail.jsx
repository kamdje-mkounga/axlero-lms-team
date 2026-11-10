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
  const courseId = course?.id || course?._id;
  const [courseDetails, setCourseDetails] = useState(course || null);
  const [enrollment, setEnrollment] = useState(null);
  const [enrolled, setEnrolled] = useState(course?.isEnrolled || false);
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!courseId) return;

    let active = true;

    async function loadCourse() {
      setLoading(true);
      setError('');

      try {
        const [details, enrollments] = await Promise.all([
          getCourseById(courseId),
          getMyEnrollments(),
        ]);

        if (!active) return;

        setCourseDetails(details);

        // Vérifie si le backend renvoie directement l'info d'inscription
        let isAlreadyEnrolled = details?.isEnrolled || false;

        const currentEnrollment = enrollments.find((item) => {
          const enrolledCourseId =
            item.courseId ||
            item.course?._id ||
            item.course?.id ||
            item.course;

          return (
            String(enrolledCourseId) === String(courseId) ||
            String(enrolledCourseId) === String(course?._id)
          );
        });

        if (currentEnrollment) {
          isAlreadyEnrolled = true;
          setEnrollment(currentEnrollment);
        }

        setEnrolled(isAlreadyEnrolled);
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
  }, [courseId, course]);

  async function handleEnroll() {
    const targetId = courseDetails?.id || courseDetails?._id || courseId;
    if (!targetId || enrolling) return;

    setEnrolling(true);
    setError('');
    setMessage('');

    try {
      await enrollInCourse(targetId);

      // Rafraîchit les inscriptions après succès
      const enrollments = await getMyEnrollments();

      const currentEnrollment = enrollments.find((item) => {
        const enrolledCourseId =
          item.courseId ||
          item.course?._id ||
          item.course?.id ||
          item.course;

        return (
          String(enrolledCourseId) === String(targetId)
        );
      });

      setEnrollment(currentEnrollment || null);
      setEnrolled(true);

      setMessage('Enrollment successful!');
    } catch (err) {
      if (err.status === 409 || err.message?.toLowerCase().includes('already enrolled')) {
        setEnrolled(true);
        setMessage('You are already enrolled in this course.');
        return;
      }

      setError(
        err.message || 'Unable to enroll in this course.'
      );
    } finally {
      setEnrolling(false);
    }
  }

  function handleContinue() {
    if (typeof onContinue === 'function') {
      onContinue({
        course: courseDetails,
        enrollment: enrollment || { courseId },
      });
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
      : selectedCourse.instructor?.name || selectedCourse.instructor?.email || 'Not specified';

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

      {/* Affichage des chapitres et leçons si disponibles */}
      {selectedCourse.chapters && selectedCourse.chapters.length > 0 && (
        <div className="course-chapters-section" style={{ marginTop: '20px', marginBottom: '20px' }}>
          <h3>Course Content ({selectedCourse.chapters.length} Chapters)</h3>
          <ul>
            {selectedCourse.chapters.map((chapter, index) => (
              <li key={chapter._id || index} style={{ marginBottom: '10px' }}>
                <strong>Chapter {index + 1}: {chapter.title}</strong>
                {chapter.lessons && chapter.lessons.length > 0 && (
                  <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
                    {chapter.lessons.map((lesson, lIndex) => (
                      <li key={lesson._id || lIndex}>
                        {lesson.title} {lesson.duration ? `(${lesson.duration} min)` : ''}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {enrolled ? (
        <button
          type="button"
          onClick={handleContinue}
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

      {message && <p role="status" style={{ marginTop: '10px', color: 'green' }}>{message}</p>}
    </section>
  );
}