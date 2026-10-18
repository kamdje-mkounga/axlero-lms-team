
import { useEffect, useState } from 'react';

const API = 'http://localhost:5000/api';

export default function CourseDetail({ course, onBack }) {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!course?._id) {
      setLoading(false);
      return;
    }

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
        ← Back to Courses
      </button>

      <h2>{course.title}</h2>
      <p>{course.description || 'No description available.'}</p>
      <p>Category: {course.category || 'General'}</p>

      <h3>Course Lessons</h3>

      {loading && <p>Loading lessons...</p>}
      {error && <p role="alert">{error}</p>}

      {!loading && !error && lessons.length === 0 && (
        <p>No lessons added yet.</p>
      )}

      {!loading && !error && lessons.map((lesson) => (
        <article className="student-course-card" key={lesson._id}>
          <h4>{lesson.title}</h4>
          <p>Type: {lesson.type || 'Lesson'}</p>

          {lesson.type === 'video' && lesson.videoUrl && (
            <a href={lesson.videoUrl} target="_blank" rel="noreferrer">
              Open lesson video
            </a>
          )}

          {lesson.type === 'text' && lesson.content && (
            <p>{lesson.content}</p>
          )}
        </article>
      ))}
    </section>
  );
}
