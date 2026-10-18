
import { useEffect, useState } from 'react';

const API = 'http://localhost:5000/api';

export default function CourseDetail({ course, onBack }) {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!course?._id) return;

    const controller = new AbortController();

    async function fetchLessons() {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(
          `${API}/courses/${course._id}/lessons`,
          { signal: controller.signal }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Unable to load lessons');
        }

        setLessons(data.lessons || []);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Unable to load lessons.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchLessons();

    return () => controller.abort();
  }, [course?._id]);

  if (!course) {
    return <p>No course selected.</p>;
  }

  return (
    <section className="student-page">
      <button type="button" onClick={onBack}>
        Back to Courses
      </button>

      <h2>{course.title}</h2>
      <p>{course.description || 'No description available.'}</p>
      <p>Category: {course.category || 'General'}</p>

      {course.instructor?.name && (
        <p>Instructor: {course.instructor.name}</p>
      )}

      <h3>Course Lessons</h3>

      {loading && <p>Loading lessons...</p>}
      {error && <p role="alert">{error}</p>}

      {!loading && !error && lessons.length === 0 && (
        <p>No lessons available yet.</p>
      )}

      {!loading && !error && lessons.map((lesson, index) => (
        <article className="lesson-item" key={lesson._id}>
          <h4>{index + 1}. {lesson.title}</h4>

          {lesson.type === 'video' && lesson.videoUrl ? (
            <a
              href={lesson.videoUrl}
              target="_blank"
              rel="noreferrer"
            >
              Open Lesson Video
            </a>
          ) : (
            <p>{lesson.content || 'No lesson content available.'}</p>
          )}
        </article>
      ))}
    </section>
  );
}
