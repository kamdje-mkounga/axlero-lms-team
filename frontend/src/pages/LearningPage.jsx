
import { useState } from 'react';

const lessons = [
  {
    title: 'Lesson 1: Introduction to Web Development',
    content:
      'Web development is the process of creating websites and web applications. It includes frontend development, backend development, and databases.',
  },
  {
    title: 'Lesson 2: HTML Basics',
    content:
      'HTML stands for HyperText Markup Language. It defines the structure of a webpage using headings, paragraphs, links, and images.',
  },
  {
    title: 'Lesson 3: CSS Basics',
    content:
      'CSS stands for Cascading Style Sheets. It styles webpages using colors, fonts, spacing, layouts, and backgrounds.',
  },
  {
    title: 'Lesson 4: JavaScript Basics',
    content:
      'JavaScript makes webpages interactive. It can respond to button clicks, validate forms, and update webpage content.',
  },
];

function getProgressKey(courseId) {
  return `axlero-progress-${courseId}`;
}

function getCompletedLessons(courseId) {
  try {
    return JSON.parse(
      localStorage.getItem(getProgressKey(courseId)) || '[]'
    );
  } catch {
    return [];
  }
}

export default function LearningPage({ course, onBack }) {
  const courseId = course?._id || course?.id || course?.courseId || course?.title;

  const [currentLesson, setCurrentLesson] = useState(0);
  const [completedLessons, setCompletedLessons] = useState(
    () => getCompletedLessons(courseId)
  );

  const lesson = lessons[currentLesson];
  const progress = Math.round(
    (completedLessons.length / lessons.length) * 100
  );

  function markComplete() {
    setCompletedLessons((previous) => {
      if (previous.includes(currentLesson)) return previous;

      const updated = [...previous, currentLesson];

      localStorage.setItem(
        getProgressKey(courseId),
        JSON.stringify(updated)
      );

      return updated;
    });
  }

  return (
    <section className="student-page">
      <button type="button" onClick={onBack}>
        Back to My Learning
      </button>

      <h2>{course?.title || 'Course Learning'}</h2>

      <p>Lesson {currentLesson + 1} of {lessons.length}</p>

      <h3>{lesson.title}</h3>
      <p>{lesson.content}</p>

      <p>
        Course Progress: <strong>{progress}%</strong>
      </p>

      <progress value={progress} max="100" />

      <div className="lesson-actions">
        <button
          type="button"
          onClick={() =>
            setCurrentLesson((previous) => Math.max(0, previous - 1))
          }
          disabled={currentLesson === 0}
        >
          Previous Lesson
        </button>

        <button
          type="button"
          onClick={markComplete}
          disabled={completedLessons.includes(currentLesson)}
        >
          {completedLessons.includes(currentLesson)
            ? 'Lesson Completed'
            : 'Mark as Complete'}
        </button>

        <button
          type="button"
          onClick={() =>
            setCurrentLesson((previous) =>
              Math.min(lessons.length - 1, previous + 1)
            )
          }
          disabled={currentLesson === lessons.length - 1}
        >
          Next Lesson
        </button>
      </div>

      {progress === 100 && (
        <p role="status">
          Congratulations! You completed all lessons.
        </p>
      )}
    </section>
  );
}
