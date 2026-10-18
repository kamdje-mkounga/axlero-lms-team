import { useEffect, useState } from 'react';
import './App.css';

const API = 'http://localhost:5000/api';

function App() {
  const [page, setPage] = useState('home');
  const [mode, setMode] = useState('register');
  const [user, setUser] = useState(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');

  const [courses, setCourses] = useState([]);
  const [publicCourses, setPublicCourses] = useState([]);
  const [myLearning, setMyLearning] = useState([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');

  const [lessonCourseId, setLessonCourseId] = useState('');
  const [lessons, setLessons] = useState([]);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonType, setLessonType] = useState('text');
  const [lessonContent, setLessonContent] = useState('');
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');

  const [quizCourseId, setQuizCourseId] = useState('');
  const [quizzes, setQuizzes] = useState([]);
  const [quizQuestion, setQuizQuestion] = useState('');
  const [quizOptions, setQuizOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);

  const [courseProgress, setCourseProgress] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const token = () => sessionStorage.getItem('axleroToken');

  function authHeaders(json = true) {
    return {
      ...(json ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${token()}`,
    };
  }

  function clearMessages() {
    setMessage('');
    setError('');
  }

  function openAuth(selectedMode) {
    setMode(selectedMode);
    setPage('auth');
    clearMessages();
  }

  async function request(url, options = {}) {
    const response = await fetch(`${API}${url}`, options);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  }

  // Authentication
  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      const endpoint =
        mode === 'register' ? '/auth/register' : '/auth/login';

      const body =
        mode === 'register'
          ? { name, email, password, role }
          : { email, password };

      const data = await request(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (mode === 'register') {
        setMessage('Registration successful! Please log in.');
        setMode('login');
        setName('');
      } else {
        sessionStorage.setItem('axleroToken', data.token);
        setUser(data.user);
        setPage('home');
        setMessage(`Welcome, ${data.user.name}!`);
      }

      setPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    sessionStorage.removeItem('axleroToken');
    setUser(null);
    setCourses([]);
    setMyLearning([]);
    setCourseProgress({});
    setLessonCourseId('');
    setLessons([]);
    setQuizCourseId('');
    setQuizzes([]);
    setQuizAnswers({});
    setQuizResult(null);
    setPage('home');
    clearMessages();
    setMessage('Logged out successfully.');
  }

  // Public courses
  async function loadPublicCourses() {
    try {
      const data = await request('/courses');
      setPublicCourses(data.courses || []);
    } catch (err) {
      setError(err.message);
    }
  }

  // Instructor courses
  async function loadCourses() {
    if (!token()) return;

    try {
      const data = await request('/courses/my-courses', {
        headers: authHeaders(false),
      });
      setCourses(data.courses || []);
    } catch (err) {
      setError(err.message);
    }
  }

  // Student enrolled courses
  async function loadMyLearning() {
    if (!token()) return;

    try {
      const data = await request('/enrollments/my-learning', {
        headers: authHeaders(false),
      });
      setMyLearning(data.enrollments || []);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadPublicCourses();
  }, []);

  useEffect(() => {
    if (user?.role === 'instructor') {
      loadCourses();
      setMyLearning([]);
    } else if (user?.role === 'student') {
      loadMyLearning();
      setCourses([]);
    } else {
      setCourses([]);
      setMyLearning([]);
    }
  }, [user]);

  // Create course
  async function handleCreateCourse(event) {
    event.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      await request('/courses', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ title, description, category }),
      });

      setTitle('');
      setDescription('');
      setCategory('');
      setMessage('Course created successfully!');

      await loadCourses();
      await loadPublicCourses();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Enroll in course
  async function handleEnroll(courseId) {
    if (!user) {
      openAuth('login');
      setMessage('Please log in as a student to enroll.');
      return;
    }

    if (user.role !== 'student') {
      setError('Only students can enroll in courses.');
      return;
    }

    clearMessages();
    setLoading(true);

    try {
      await request(`/enrollments/${courseId}`, {
        method: 'POST',
        headers: authHeaders(),
      });

      setMessage('Enrolled successfully!');
      await loadMyLearning();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function isEnrolled(courseId) {
    return myLearning.some(
      (item) => String(item.course?._id) === String(courseId)
    );
  }

  // Add lesson
  async function handleAddLesson(event, courseId) {
    event.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      const data = await request(`/courses/${courseId}/lessons`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          title: lessonTitle,
          type: lessonType,
          content: lessonType === 'text' ? lessonContent : '',
          videoUrl: lessonType === 'video' ? lessonVideoUrl : '',
        }),
      });

      setLessons(data.lessons || []);
      setLessonTitle('');
      setLessonContent('');
      setLessonVideoUrl('');
      setMessage('Lesson added successfully!');
      await loadPublicCourses();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Load lessons
  async function loadLessons(courseId) {
    clearMessages();
    setLessonCourseId(courseId);
    setLessons([]);
    setLoading(true);

    try {
      const data = await request(`/courses/${courseId}/lessons`, {
        headers: authHeaders(false),
      });

      setLessons(data.lessons || []);

      if (user?.role === 'student') {
        await loadProgress(courseId, data.lessons || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Progress tracking
  async function loadProgress(courseId, lessonList = []) {
    try {
      const data = await request(`/progress/${courseId}`, {
        headers: authHeaders(false),
      });

      setCourseProgress((prev) => ({
        ...prev,
        [courseId]: {
          completedLessons: (data.completedLessons || []).map(
            (id) => String(id?._id || id)
          ),
          totalLessons: data.totalLessons ?? lessonList.length,
          completedCount: data.completedCount || 0,
          percentage: data.percentage || 0,
        },
      }));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCompleteLesson(courseId, lessonId) {
    clearMessages();

    try {
      await request(
        `/progress/${courseId}/complete/${lessonId}`,
        {
          method: 'POST',
          headers: authHeaders(false),
        }
      );

      setMessage('Lesson marked as completed!');
      await loadProgress(courseId, lessons);
    } catch (err) {
      setError(err.message);
    }
  }

  // Instructor: add quiz question
  async function handleAddQuiz(event, courseId) {
    event.preventDefault();
    clearMessages();

    const options = quizOptions.map((option) => option.trim());

    if (options.some((option) => !option)) {
      setError('Please fill in all four options.');
      return;
    }

    if (!correctAnswer || !options.includes(correctAnswer.trim())) {
      setError('Please select the correct answer.');
      return;
    }

    setLoading(true);

    try {
      const data = await request(`/courses/${courseId}/quizzes`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          question: quizQuestion,
          options,
          correctAnswer: correctAnswer.trim(),
        }),
      });

      setQuizzes(data.quizzes || []);
      setQuizQuestion('');
      setQuizOptions(['', '', '', '']);
      setCorrectAnswer('');
      setMessage('Quiz question added successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Load quiz questions
  async function loadQuizzes(courseId) {
    clearMessages();
    setQuizCourseId(courseId);
    setQuizzes([]);
    setQuizAnswers({});
    setQuizResult(null);
    setLoading(true);

    try {
      const data = await request(`/courses/${courseId}/quizzes`, {
        headers: authHeaders(false),
      });

      setQuizzes(data.quizzes || []);
      if (!data.quizzes?.length) {
        setMessage('No quiz questions available yet.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Student: submit quiz and show score
  async function handleSubmitQuiz(event, courseId) {
    event.preventDefault();
    clearMessages();
    setLoading(true);

    const answers = quizzes.map((quiz) => ({
      quizId: quiz._id,
      answer: quizAnswers[quiz._id] || '',
    }));

    try {
      const data = await request(
        `/courses/${courseId}/quizzes/submit`,
        {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ answers }),
        }
      );

      setQuizResult(data);
      setMessage('Quiz submitted successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Instructor dashboard lesson manager
  function renderInstructorLessons(course) {
    return (
      <div className="lesson-panel">
        <h4>Add Lesson</h4>

        <form onSubmit={(event) => handleAddLesson(event, course._id)}>
          <label>Lesson Title</label>
          <input
            value={lessonTitle}
            onChange={(e) => setLessonTitle(e.target.value)}
            required
          />

          <label>Lesson Type</label>
          <select
            value={lessonType}
            onChange={(e) => setLessonType(e.target.value)}
          >
            <option value="text">Text</option>
            <option value="video">Video</option>
          </select>

          {lessonType === 'text' ? (
            <>
              <label>Lesson Content</label>
              <textarea
                value={lessonContent}
                onChange={(e) => setLessonContent(e.target.value)}
                required
              />
            </>
          ) : (
            <>
              <label>Video URL</label>
              <input
                type="url"
                value={lessonVideoUrl}
                onChange={(e) => setLessonVideoUrl(e.target.value)}
                required
              />
            </>
          )}

          <button disabled={loading}>
            {loading ? 'Saving...' : 'Add Lesson'}
          </button>
        </form>

        <h4>Course Lessons</h4>
        {lessons.length === 0 ? (
          <p>No lessons added yet.</p>
        ) : (
          lessons.map((lesson, index) => (
            <article className="lesson-item" key={lesson._id || index}>
              <strong>{index + 1}. {lesson.title}</strong>
              <p>Type: {lesson.type}</p>
            </article>
          ))
        )}
      </div>
    );
  }

  // Instructor quiz manager
  function renderInstructorQuizzes(course) {
    return (
      <div className="lesson-panel">
        <h4>Add Quiz Question</h4>

        <form onSubmit={(event) => handleAddQuiz(event, course._id)}>
          <label>Question</label>
          <textarea
            value={quizQuestion}
            onChange={(e) => setQuizQuestion(e.target.value)}
            placeholder="Example: What is React?"
            required
          />

          {quizOptions.map((option, index) => (
            <div key={index}>
              <label>Option {index + 1}</label>
              <input
                value={option}
                onChange={(e) => {
                  const updated = [...quizOptions];
                  updated[index] = e.target.value;
                  setQuizOptions(updated);
                }}
                required
              />
            </div>
          ))}

          <label>Correct Answer</label>
          <select
            value={correctAnswer}
            onChange={(e) => setCorrectAnswer(e.target.value)}
            required
          >
            <option value="">Select correct option</option>
            {quizOptions.filter((option) => option.trim()).map(
              (option, index) => (
                <option key={`${index}-${option}`} value={option.trim()}>
                  {option}
                </option>
              )
            )}
          </select>

          <button disabled={loading}>
            {loading ? 'Saving...' : 'Add Quiz Question'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => loadQuizzes(course._id)}
        >
          View Quiz Questions
        </button>

        {quizCourseId === course._id && quizzes.map((quiz, index) => (
          <article className="lesson-item" key={quiz._id}>
            <strong>{index + 1}. {quiz.question}</strong>
            <ul>
              {quiz.options.map((option, i) => (
                <li key={i}>{option}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    );
  }

  // Student quiz panel
  function renderStudentQuiz(course) {
    const isOpen = quizCourseId === course._id;

    return (
      <div className="lesson-panel">
        <button
          type="button"
          onClick={() => {
            if (isOpen) {
              setQuizCourseId('');
              setQuizzes([]);
              setQuizResult(null);
              setQuizAnswers({});
            } else {
              loadQuizzes(course._id);
            }
          }}
        >
          {isOpen ? 'Hide Quiz' : 'Attempt Quiz'}
        </button>

        {isOpen && (
          <>
            <h4>Course Quiz</h4>

            {loading && <p>Loading quiz...</p>}

            {!loading && quizzes.length === 0 && (
              <p>No quiz questions available yet.</p>
            )}

            {!quizResult && quizzes.length > 0 && (
              <form onSubmit={(event) => handleSubmitQuiz(event, course._id)}>
                {quizzes.map((quiz, index) => (
                  <fieldset className="lesson-item" key={quiz._id}>
                    <legend>
                      {index + 1}. {quiz.question}
                    </legend>

                    {quiz.options.map((option, optionIndex) => (
                      <label
                        key={optionIndex}
                        style={{
                          display: 'block',
                          margin: '10px 0',
                        }}
                      >
                        <input
                          type="radio"
                          name={quiz._id}
                          value={option}
                          checked={quizAnswers[quiz._id] === option}
                          onChange={() =>
                            setQuizAnswers((prev) => ({
                              ...prev,
                              [quiz._id]: option,
                            }))
                          }
                          required
                        />
                        {' '}{option}
                      </label>
                    ))}
                  </fieldset>
                ))}

                <button type="submit" disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit Quiz'}
                </button>
              </form>
            )}

            {quizResult && (
              <div className="progress-panel">
                <h4>Quiz Result</h4>
                <p>
                  Score: <strong>{quizResult.score} / {quizResult.total}</strong>
                </p>
                <p>
                  Percentage: <strong>{quizResult.percentage}%</strong>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setQuizResult(null);
                    setQuizAnswers({});
                  }}
                >
                  Try Again
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="app">
      <header className="navbar">
        <h2
          style={{ cursor: 'pointer' }}
          onClick={() => setPage('home')}
        >
          Axlero LMS
        </h2>

        <nav>
          <button className="nav-link" onClick={() => setPage('home')}>
            Home
          </button>

          <button
            className="nav-link"
            onClick={() =>
              document.getElementById('courses')?.scrollIntoView({
                behavior: 'smooth',
              })
            }
          >
            Courses
          </button>

          {user?.role === 'student' && (
            <button
              className="nav-link"
              onClick={() =>
                document.getElementById('my-learning')?.scrollIntoView({
                  behavior: 'smooth',
                })
              }
            >
              My Learning
            </button>
          )}

          {user ? (
            <>
              <span>Hi, {user.name}</span>
              <button onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <button onClick={() => openAuth('login')}>Login</button>
              <button onClick={() => openAuth('register')}>Get Started</button>
            </>
          )}
        </nav>
      </header>

      {message && <p className="home-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}

      {page === 'auth' ? (
        <main className="auth-section">
          <form className="auth-card" onSubmit={handleSubmit}>
            <h1>{mode === 'register' ? 'Create Your Account' : 'Welcome Back'}</h1>

            {mode === 'register' && (
              <>
                <label>Full Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </>
            )}

            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />

            {mode === 'register' && (
              <>
                <label>Register As</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="student">Student</option>
                  <option value="instructor">Instructor</option>
                </select>
              </>
            )}

            <button disabled={loading}>
              {loading ? 'Please wait...' : mode === 'register' ? 'Create Account' : 'Login'}
            </button>

            <p>
              {mode === 'register' ? 'Already have an account?' : "Don't have an account?"}
              {' '}
              <button
                type="button"
                className="text-button"
                onClick={() => openAuth(mode === 'register' ? 'login' : 'register')}
              >
                {mode === 'register' ? 'Login' : 'Register'}
              </button>
            </p>

            <button type="button" onClick={() => setPage('home')}>
              Back to Home
            </button>
          </form>
        </main>
      ) : (
        <>
          <main className="hero">
            <p className="tagline">YOUR LEARNING JOURNEY STARTS HERE</p>
            <h1>Learn New Skills.<br />Build Your Future.</h1>
            <p className="description">
              Explore courses, learn from instructors, and grow your skills with Axlero LMS.
            </p>
            <button
              onClick={() =>
                document.getElementById('courses')?.scrollIntoView({
                  behavior: 'smooth',
                })
              }
            >
              Explore Courses
            </button>

            {!user && (
              <button className="secondary-button" onClick={() => openAuth('register')}>
                Join Axlero
              </button>
            )}

            {user && (
              <p>Welcome, {user.name}! Logged in as {user.role}.</p>
            )}
          </main>

          {user?.role === 'instructor' && (
            <section className="instructor-section">
              <h2>Instructor Dashboard</h2>
              <p>Create courses, lessons and quizzes.</p>

              <form className="course-form" onSubmit={handleCreateCourse}>
                <h3>Create New Course</h3>

                <label>Course Title</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} required />

                <label>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  required
                />

                <label>Category</label>
                <input value={category} onChange={(e) => setCategory(e.target.value)} required />

                <button disabled={loading}>
                  {loading ? 'Creating...' : 'Create Course'}
                </button>
              </form>

              <h3>My Courses</h3>
              <div className="course-list">
                {courses.map((course) => (
                  <article className="course-card" key={course._id}>
                    <h3>{course.title}</h3>
                    <p>{course.description}</p>
                    <p>Category: {course.category}</p>

                    <button
                      onClick={() => {
                        if (lessonCourseId === course._id) {
                          setLessonCourseId('');
                          setLessons([]);
                        } else {
                          setLessonCourseId(course._id);
                          setLessons(course.lessons || []);
                        }
                      }}
                    >
                      {lessonCourseId === course._id ? 'Close Lessons' : 'Manage Lessons'}
                    </button>

                    {lessonCourseId === course._id && renderInstructorLessons(course)}

                    <button
                      onClick={() => {
                        setQuizCourseId(course._id);
                        setQuizzes([]);
                        setQuizResult(null);
                      }}
                    >
                      Manage Quizzes
                    </button>

                    {quizCourseId === course._id && renderInstructorQuizzes(course)}
                  </article>
                ))}
              </div>
            </section>
          )}

          <section id="courses" className="courses">
            <h2>Explore Our Courses</h2>
            <p>Your next skill starts with one course.</p>

            <div className="course-list">
              {publicCourses.map((course) => (
                <article className="course-card" key={course._id}>
                  <h3>{course.title}</h3>
                  <p>{course.description}</p>
                  <p><strong>Category:</strong> {course.category}</p>

                  {course.instructor?.name && (
                    <p><strong>Instructor:</strong> {course.instructor.name}</p>
                  )}

                  {user?.role === 'student' && (
                    <button
                      disabled={loading || isEnrolled(course._id)}
                      onClick={() => handleEnroll(course._id)}
                    >
                      {isEnrolled(course._id) ? 'Enrolled' : 'Enroll Now'}
                    </button>
                  )}

                  {!user && (
                    <button onClick={() => openAuth('login')}>Login to Enroll</button>
                  )}
                </article>
              ))}

              {publicCourses.length === 0 && <p>No courses available yet.</p>}
            </div>
          </section>

          {user?.role === 'student' && (
            <section id="my-learning" className="courses">
              <h2>My Learning</h2>

              {myLearning.length === 0 ? (
                <p>You haven't enrolled in any courses yet.</p>
              ) : (
                <div className="course-list">
                  {myLearning.map((enrollment) => {
                    const course = enrollment.course;
                    if (!course) return null;

                    const progress = courseProgress[course._id];
                    const showingLessons = lessonCourseId === course._id;

                    return (
                      <article className="course-card" key={enrollment._id}>
                        <h3>{course.title}</h3>
                        <p>{course.description}</p>
                        <p><strong>Category:</strong> {course.category}</p>

                        <button
                          onClick={() => {
                            if (showingLessons) {
                              setLessonCourseId('');
                              setLessons([]);
                            } else {
                              loadLessons(course._id);
                            }
                          }}
                        >
                          {showingLessons ? 'Hide Lessons' : 'View Lessons'}
                        </button>

                        {showingLessons && (
                          <div className="lesson-panel">
                            <h4>Course Progress: {progress?.percentage || 0}%</h4>
                            <progress
                              value={progress?.percentage || 0}
                              max="100"
                              style={{ width: '100%', height: '14px' }}
                            />
                            <p>
                              {progress?.completedCount || 0} of {progress?.totalLessons ?? lessons.length} lessons completed
                            </p>

                            {lessons.length === 0 ? (
                              <p>No lessons available yet.</p>
                            ) : (
                              lessons.map((lesson, index) => {
                                const completed = (
                                  progress?.completedLessons || []
                                ).includes(String(lesson._id));

                                return (
                                  <article className="lesson-item" key={lesson._id || index}>
                                    <h4>{index + 1}. {lesson.title}</h4>

                                    {lesson.type === 'video' ? (
                                      <a href={lesson.videoUrl} target="_blank" rel="noreferrer">
                                        Open Video
                                      </a>
                                    ) : (
                                      <p>{lesson.content}</p>
                                    )}

                                    <button
                                      disabled={completed}
                                      onClick={() => handleCompleteLesson(course._id, lesson._id)}
                                    >
                                      {completed ? '✓ Completed' : 'Mark as Completed'}
                                    </button>
                                  </article>
                                );
                              })
                            )}
                          </div>
                        )}

                        {renderStudentQuiz(course)}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          )}
        </>
      )}

      <footer>© 2026 Axlero LMS. Learn, Grow, Succeed.</footer>
    </div>
  );
}

export default App;