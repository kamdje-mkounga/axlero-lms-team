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
        console.log('Enrollments response:', data);

        if (active) {
          const enrollmentList = Array.isArray(data)
            ? data
            : data.enrollments || data.data || [];

          setEnrollments(enrollmentList);
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
            // Gère de manière sécurisée si enrollment.course est un objet ou juste un ID (string)
            let courseObj = {};
            if (typeof enrollment.course === 'object' && enrollment.course !== null) {
              courseObj = enrollment.course;
            } else {
              courseObj = {
                _id: enrollment.course || enrollment.courseId,
                title: enrollment.courseTitle || enrollment.title || `Course #${index + 1}`,
                description: enrollment.description || enrollment.courseDescription || 'No description available.',
                category: enrollment.category || 'General'
              };
            }

            const courseId = courseObj._id || courseObj.id || enrollment.courseId || index;

            // Récupération sécurisée des champs avec tous les noms possibles
            const courseTitle = courseObj.title || courseObj.name || courseObj.courseTitle || 'Untitled Course';
            const courseDesc = courseObj.description || courseObj.desc || 'No description available.';
            const courseCategory = courseObj.category || courseObj.cat || 'General';

            // Récupération dynamique du nombre total de leçons du cours
            const courseLessons = (() => {
              if (Array.isArray(courseObj?.chapters)) {
                return courseObj.chapters.flatMap(ch => ch.lessons || []);
              }
              return Array.isArray(courseObj?.lessons) ? courseObj.lessons : [];
            })();

            const totalLessonsCount = courseLessons.length > 0 ? courseLessons.length : 4;

            const savedLessons = (() => {
              try {
                return JSON.parse(
                  localStorage.getItem(`axlero-progress-${courseId}`) || '[]'
                );
              } catch {
                return [];
              }
            })();

            // Calcul dynamique du pourcentage basé sur le vrai nombre de leçons
            const localProgress = Math.round(
              (savedLessons.length / totalLessonsCount) * 100
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
                key={enrollment._id || courseId}
              >
                <h3>{courseTitle}</h3>

                <p>{courseDesc}</p>

                <p>Category: {courseCategory}</p>

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
                  onClick={() => onSelectCourse?.(courseObj)}
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