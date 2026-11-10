
import { useEffect, useState } from 'react';
import { getMyEnrollments } from '../api/courseApi';

function getCourseProgress(enrollment, course) {
  const courseId =
    course._id || course.id || enrollment.courseId || course.title;

  let savedLessons = [];

  try {
    savedLessons = JSON.parse(
      localStorage.getItem(`axlero-progress-${courseId}`) || '[]'
    );
  } catch {
    savedLessons = [];
  }

  const lessons = Array.isArray(course.lessons)
    ? course.lessons
    : Array.isArray(course.chapters)
      ? course.chapters.flatMap(
          (chapter) => chapter.lessons || []
        )
      : [];

  const totalLessons = lessons.length;

  const validCompletedLessons = [
    ...new Set(savedLessons),
  ].filter((id) =>
    lessons.some(
      (lesson) =>
        String(lesson._id || lesson.id) === String(id)
    )
  );

  const localProgress =
    totalLessons > 0
      ? Math.round(
          (validCompletedLessons.length / totalLessons) * 100
        )
      : 0;

  const progress = Math.max(
    Number(enrollment.progress) || 0,
    localProgress
  );

  return Math.min(100, Math.max(0, progress));
}

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
          setEnrollments(Array.isArray(data) ? data : []);
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

  const validEnrollments = enrollments.filter(
    (enrollment) => enrollment.course
  );

  const completedCourses = validEnrollments.filter(
    (enrollment) =>
      getCourseProgress(enrollment, enrollment.course) === 100
  ).length;

  return (
    <section className="student-page">
      <div className="student-dashboard-header">
        <span className="student-eyebrow">
          STUDENT LEARNING SPACE
        </span>

        <h2>My Learning Dashboard</h2>

        <p>
          View your enrolled courses and continue learning.
        </p>
      </div>

      {!loading && !error && (
        <div className="student-stats-grid">
          <div className="student-stat-card">
            <div className="student-stat-icon">📚</div>
            <div>
              <h3>{validEnrollments.length}</h3>
              <p>Enrolled Courses</p>
            </div>
          </div>

          <div className="student-stat-card">
            <div className="student-stat-icon">🏆</div>
            <div>
              <h3>{completedCourses}</h3>
              <p>Completed Courses</p>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <p className="student-message" role="status">
          Loading your courses...
        </p>
      )}

      {error && (
        <p className="student-error" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && validEnrollments.length === 0 && (
        <div className="student-empty-state">
          <div className="student-empty-icon">🎓</div>
          <h3>No courses enrolled yet</h3>
          <p>
            Visit the Course Catalog to explore courses and start learning.
          </p>
        </div>
      )}

      {!loading && !error && validEnrollments.length > 0 && (
        <div className="student-courses-section">
          <div className="student-section-header">
            <h3>My Courses</h3>
            <p>Continue your learning journey.</p>
          </div>

          <div className="student-course-grid">
            {validEnrollments.map((enrollment, index) => {
              const course = enrollment.course;
              const progress = getCourseProgress(
                enrollment,
                course
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
                  <div className="student-course-icon">
                    📘
                  </div>

                  <div className="student-course-content">
                    <span className="student-course-category">
                      {course.category || 'General'}
                    </span>

                    <h3>
                      {course.title || 'Untitled Course'}
                    </h3>

                    <p>
                      {course.description ||
                        'No description available.'}
                    </p>
                  </div>

                  <div className="student-progress-section">
                    <div className="student-progress-heading">
                      <span>Course Progress</span>
                      <strong>{progress}%</strong>
                    </div>

                    <div
                      className="student-progress-track"
                      role="progressbar"
                      aria-valuenow={progress}
                      aria-valuemin="0"
                      aria-valuemax="100"
                      aria-label={`Course progress: ${progress}%`}
                    >
                      <div
                        className="student-progress-fill"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <p className="student-progress-message">
                      {progress === 100
                        ? '🎉 Course completed!'
                        : 'Keep learning to complete this course.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="student-course-button"
                    onClick={() => onSelectCourse?.(course)}
                  >
                    {progress === 100
                      ? 'Review Course'
                      : 'Continue Learning'}
                    <span> →</span>
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
