import { useEffect, useState, useRef } from 'react';
import QuizSession from './QuizSession'; // 👈 1. Importez votre composant QuizSession

const API =
  `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

function getProgressKey(courseId) {
  return `axlero-progress-${courseId}`;
}

function getSavedProgress(courseId) {
  try {
    return JSON.parse(
      localStorage.getItem(getProgressKey(courseId)) || '[]'
    );
  } catch {
    return [];
  }
}

function getLessonId(lesson) {
  return String(lesson?._id || lesson?.id || '');
}

function getCourseLessons(course) {
  if (Array.isArray(course?.chapters)) {
    return course.chapters.flatMap((chapter) =>
      (chapter.lessons || []).map((lesson) => ({
        ...lesson,
        chapterTitle: chapter.title,
      }))
    );
  }

  return Array.isArray(course?.lessons)
    ? course.lessons
    : [];
}


function getStudentName() {
  try {
    const userStr = sessionStorage.getItem('axleroUser') || localStorage.getItem('axleroUser');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.name || user.fullName || user.username) {
        return user.name || user.fullName || user.username;
      }
    }

    const token = sessionStorage.getItem('axleroToken') || localStorage.getItem('axleroToken');
    if (token) {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      const decoded = JSON.parse(jsonPayload);
      if (decoded.name || decoded.fullName || decoded.username) {
        return decoded.name || decoded.fullName || decoded.username;
      }
      if (decoded.email) {
        return decoded.email.split('@')[0];
      }
    }

  } catch (e) { }
  return 'Valued Student';
}

  } catch (e) {
    // En cas d'erreur de lecture
  }
  return 'Valued Student';
}

// Fonction utilitaire pour transformer un lien YouTube classique en lien embed si besoin

function getEmbedUrl(url) {
  if (!url) return null;
  if (url.includes('youtube.com/watch?v=')) {
    return url.replace('watch?v=', 'embed/');
  }
  if (url.includes('youtu.be/')) {
    return url.replace('youtu.be/', 'www.youtube.com/embed/');
  }
  return url;
}

export default function LearningPage({ course, enrollment, onBack }) {
  const lessons = getCourseLessons(course);

  const courseId = course?._id || course?.id || course?.courseId;
  const enrollmentId = enrollment?._id || enrollment?.id;

  const [currentLesson, setCurrentLesson] = useState(0);
  const [studentName, setStudentName] = useState('Valued Student');

  const [completedLessons, setCompletedLessons] = useState(() =>
    getSavedProgress(courseId)
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showCertificate, setShowCertificate] = useState(false);

  // Nouveaux états pour gérer le quiz de fin de cours
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);

  const certificateRef = useRef(null);

  useEffect(() => {
    setStudentName(getStudentName());
    if (courseId) {
      localStorage.setItem(
        getProgressKey(courseId),
        JSON.stringify(completedLessons)
      );
    }
  }, [courseId, completedLessons]);

  const lesson = lessons[currentLesson];

  const validCompletedLessons = completedLessons.filter((id) =>
    lessons.some((item) => getLessonId(item) === id)
  );

  const progress = lessons.length
    ? Math.round((validCompletedLessons.length / lessons.length) * 100)
    : 0;

  async function markComplete() {
    if (!lesson || saving) return;

    const lessonId = getLessonId(lesson);

    if (!lessonId) {
      setError('Lesson ID not found.');
      return;
    }

    if (completedLessons.includes(lessonId)) return;

    const updatedLessons = [...completedLessons, lessonId];

    setSaving(true);
    setError('');
    setMessage('');

    try {
      if (USE_MOCK) {
        setCompletedLessons(updatedLessons);
        setMessage('Lesson progress saved successfully!');
        return;
      }

      if (!enrollmentId) {
        throw new Error('Enrollment ID not found. Please refresh.');
      }

      const token = sessionStorage.getItem('axleroToken');

      const response = await fetch(
        `${API}/enrollments/${enrollmentId}/progress`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            completedLessonIds: updatedLessons,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to save lesson progress.');
      }

      setCompletedLessons(updatedLessons);
      setMessage('Lesson progress saved successfully!');
    } catch (err) {
      setError(err.message || 'Unable to update progress.');
    } finally {
      setSaving(false);
    }
  }

  function downloadCertificateImage() {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 850;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 15;
    ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

    ctx.fillStyle = '#1e1b4b';
    ctx.font = 'bold 42px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('CERTIFICATE OF COMPLETION', canvas.width / 2, 160);

    ctx.fillStyle = '#6b7280';
    ctx.font = '24px Arial';
    ctx.fillText('This is proudly presented to', canvas.width / 2, 240);

    ctx.fillStyle = '#4f46e5';
    ctx.font = 'bold 38px Arial';
    ctx.fillText(studentName, canvas.width / 2, 320);

    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(300, 350);
    ctx.lineTo(900, 350);
    ctx.stroke();

    ctx.fillStyle = '#374151';
    ctx.font = '24px Arial';
    ctx.fillText('for successfully completing the course', canvas.width / 2, 440);

    ctx.fillStyle = '#111827';
    ctx.font = 'bold 36px Arial';
    ctx.fillText(course.title || 'Course', canvas.width / 2, 520);

    ctx.fillStyle = '#9ca3af';
    ctx.font = '18px Arial';
    ctx.fillText('Axlero LMS - Verified Official Certificate', canvas.width / 2, 700);

    const link = document.createElement('a');
    link.download = `Certificate-${studentName}-${course.title || 'Course'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  if (!course) {
    return (
      <section className="student-page">
        <p>Course not found.</p>
        <button type="button" onClick={onBack}>
          Back to My Learning
        </button>
      </section>
    );
  }

  if (lessons.length === 0) {
    return (
      <section className="student-page">
        <button type="button" onClick={onBack}>
          Back to My Learning
        </button>
        <h2>{course.title}</h2>
        <p>No lessons are available for this course yet.</p>
      </section>
    );
  }

  const rawVideoUrl = lesson.videoUrl || lesson.url || lesson.resource;
  const videoEmbedUrl = getEmbedUrl(rawVideoUrl);

  return (
    <section className="student-page">
      <button type="button" onClick={onBack}>
        Back to My Learning
      </button>

      <h2>{course.title || 'Course Learning'}</h2>

      <p>Lesson {currentLesson + 1} of {lessons.length}</p>

      {lesson.chapterTitle && <p>Chapter: {lesson.chapterTitle}</p>}

      <h3>{lesson.title || lesson.name || 'Untitled Lesson'}</h3>

      <p>
        {lesson.content || lesson.description || 'No lesson description available.'}
      </p>

      {rawVideoUrl && (
        <div className="lesson-video-container" style={{ margin: '20px 0' }}>
          {videoEmbedUrl && videoEmbedUrl.includes('embed') ? (
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
              <iframe
                src={videoEmbedUrl}
                title={lesson.title}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <p>
              <a href={rawVideoUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#4f46e5', fontWeight: 'bold' }}>
                🔗 Watch Video / Access Resource Link
              </a>
            </p>
          )}
        </div>
      )}

      <p>Course Progress: <strong>{progress}%</strong></p>

      <progress value={progress} max="100" style={{ width: '100%', height: '12px' }} />

      {error && <p role="alert" style={{ color: 'red' }}>{error}</p>}
      {message && <p role="status" style={{ color: 'green' }}>{message}</p>}

      <div className="lesson-actions" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <button
          type="button"
          onClick={() => setCurrentLesson((previous) => Math.max(0, previous - 1))}
          disabled={currentLesson === 0 || saving}
        >
          Previous Lesson
        </button>

        <button
          type="button"
          onClick={markComplete}
          disabled={completedLessons.includes(getLessonId(lesson)) || saving}
        >
          {saving
            ? 'Saving...'
            : completedLessons.includes(getLessonId(lesson))
              ? 'Lesson Completed'
              : 'Mark as Complete'}
        </button>

        <button
          type="button"
          onClick={() => setCurrentLesson((previous) => Math.min(lessons.length - 1, previous + 1))}
          disabled={currentLesson === lessons.length - 1 || saving}
        >
          Next Lesson
        </button>
      </div>

      {/* MODIFICATION ICI : À 100%, l'étudiant doit passer le Quiz avant de voir le certificat */}
      {progress === 100 && !quizPassed && (
        <div style={{ marginTop: '25px', padding: '20px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', textAlign: 'center' }}>
          <p role="status" style={{ color: '#1e40af', fontWeight: 'bold', fontSize: '1.1em' }}>
            🎯 All lessons completed! Pass the final module quiz to unlock your certificate.
          </p>
          <button
            type="button"
            onClick={() => setShowQuizModal(true)}
            style={{ marginTop: '10px', background: '#2563eb', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            🧠 Take Final Module Quiz
          </button>
        </div>
      )}

      {quizPassed && (
        <div style={{ marginTop: '25px', padding: '20px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', textAlign: 'center' }}>
          <p role="status" style={{ color: '#166534', fontWeight: 'bold', fontSize: '1.1em' }}>
            🎉 Congratulations! Quiz passed and course completed successfully.
          </p>
          <button
            type="button"
            onClick={() => setShowCertificate(true)}
            style={{ marginTop: '10px', background: '#16a34a', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            📜 View Certificate
          </button>
        </div>
      )}


      {/* Fenêtre modale du Quiz */}
      {showQuizModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', width: '90%', maxWidth: '600px', borderRadius: '10px', padding: '20px', position: 'relative' }}>
            <QuizSession
              course={course}
              onBack={() => setShowQuizModal(false)}
              onComplete={(score, total) => {
                const passed = (score / total) >= 0.5; // Réussite si score >= 50%
                if (passed) {
                  setQuizPassed(true);
                  setShowQuizModal(false);
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Modal du Certificat */}

      {showCertificate && (
        <div className="certificate-modal" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div ref={certificateRef} style={{ background: '#fff', padding: '40px', borderRadius: '10px', textAlign: 'center', maxWidth: '600px', width: '90%', border: '8px solid #4f46e5', position: 'relative' }}>
            <h2>CERTIFICATE OF COMPLETION</h2>
            <p style={{ margin: '15px 0' }}>This is proudly presented to</p>
            <h3 style={{ fontSize: '1.8em', color: '#4f46e5', borderBottom: '2px solid #e5e7eb', display: 'inline-block', paddingBottom: '5px' }}>
              {studentName}
            </h3>
            <p style={{ margin: '20px 0' }}>for successfully completing the course</p>
            <h4 style={{ fontSize: '1.4em' }}>{course.title}</h4>
            <p style={{ fontSize: '0.9em', color: '#6b7280', marginTop: '30px' }}>Axlero LMS - Verified Official Certificate</p>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={downloadCertificateImage}
                style={{ background: '#4f46e5', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Download Certificate
              </button>
              <button
                type="button"
                onClick={() => setShowCertificate(false)}
                style={{ background: '#e5e7eb', color: '#374151', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}