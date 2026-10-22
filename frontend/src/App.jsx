import { useState } from 'react';
import CourseCatalog from './pages/CourseCatalog';
import CourseDetail from './pages/CourseDetail';
import StudentDashboard from './pages/StudentDashboard';
import LearningPage from './pages/LearningPage';
import InstructorCourseBuilder from './pages/InstructorCourseBuilder';
import './App.css';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

function getSavedUser() {
  try {
    return JSON.parse(sessionStorage.getItem('axleroUser')) || null;
  } catch {
    return null;
  }
}

export default function App() {
  const [page, setPage] = useState('courses');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [user, setUser] = useState(getSavedUser);
  const [authMode, setAuthMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [authError, setAuthError] = useState('');

  function openCourse(course) {
    setSelectedCourse(course);
    setPage('detail');
  }

  function openLearning(course) {
    setSelectedCourse(course);
    setPage('learning');
  }

  function showPage(nextPage) {
    setSelectedCourse(null);
    setPage(nextPage);
  }

  async function handleAuth(event) {
    event.preventDefault();
    setAuthMessage('');
    setAuthError('');
    setAuthLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      if (USE_MOCK) {
        if (authMode === 'register') {
          setAuthMessage('Demo registration successful! You can now log in.');
          setAuthMode('login');
          setPassword('');
          return;
        }

        const mockUser = {
          id: 'mock-user',
          name: name.trim() || normalizedEmail.split('@')[0],
          email: normalizedEmail,
          role,
        };

        sessionStorage.setItem('axleroToken', 'mock-demo-token');
        sessionStorage.setItem('axleroUser', JSON.stringify(mockUser));

        setUser(mockUser);
        setPassword('');
        setPage('courses');
        return;
      }

      const endpoint =
        authMode === 'register' ? '/auth/register' : '/auth/login';

      const payload =
        authMode === 'register'
          ? { name: name.trim(), email: normalizedEmail, password, role }
          : { email: normalizedEmail, password };

      const response = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed.');
      }

      if (authMode === 'register') {
        setAuthMessage('Registration successful. Please log in.');
        setAuthMode('login');
        setPassword('');
        return;
      }

      // Extraction sécurisée qu'elle vienne de data.data ou de data direct
      const resultData = data.data || data;

      if (!resultData.token || !resultData.user) {
        throw new Error('The server returned an invalid login response.');
      }

      sessionStorage.setItem('axleroToken', resultData.token);
      sessionStorage.setItem('axleroUser', JSON.stringify(resultData.user));

      setUser(resultData.user);
      setPassword('');
      setPage('courses');
    } catch (err) {
      setAuthError(err.message || 'Unable to connect to the server.');
    } finally {
      setAuthLoading(false);
    }
  }

  function logout() {
    sessionStorage.removeItem('axleroToken');
    sessionStorage.removeItem('axleroUser');
    setUser(null);
    setSelectedCourse(null);
    setPage('courses');
    setAuthMessage('');
    setAuthError('');
  }

  return (
    <div className="lms-app">
      <header className="lms-header">
        <h1>Axlero LMS</h1>

        <nav aria-label="Main navigation">
          <button type="button" onClick={() => showPage('courses')}>
            Course Catalog
          </button>

          <button type="button" onClick={() => showPage('dashboard')}>
            My Learning
          </button>

          {user?.role === 'instructor' && (
            <button type="button" onClick={() => showPage('instructor')}>
              Create Course
            </button>
          )}

          {!user ? (
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setAuthError('');
                setAuthMessage('');
                showPage('auth');
              }}
            >
              Login / Register
            </button>
          ) : (
            <button type="button" onClick={logout}>
              Logout ({user.name})
            </button>
          )}
        </nav>
      </header>

      <main>
        {page === 'auth' && (
          <section className="student-page auth-panel">
            <h2>{authMode === 'login' ? 'Login' : 'Create Account'}</h2>

            <form onSubmit={handleAuth}>
              {authMode === 'register' && (
                <>
                  <label htmlFor="auth-name">Full name</label>
                  <input
                    id="auth-name"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                  />

                  <label htmlFor="auth-role">Account type</label>
                  <select
                    id="auth-role"
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                  >
                    <option value="student">Student</option>
                    <option value="instructor">Instructor</option>
                  </select>
                </>
              )}

              <label htmlFor="auth-email">Email</label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />

              <label htmlFor="auth-password">Password</label>
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={6}
                required
              />

              {authError && <p role="alert">{authError}</p>}
              {authMessage && <p role="status">{authMessage}</p>}

              <button type="submit" disabled={authLoading}>
                {authLoading
                  ? 'Please wait...'
                  : authMode === 'login'
                    ? 'Login'
                    : 'Register'}
              </button>
            </form>

            <p>
              {authMode === 'login'
                ? "Don't have an account?"
                : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'register' : 'login');
                  setAuthError('');
                  setAuthMessage('');
                }}
              >
                {authMode === 'login' ? 'Register' : 'Login'}
              </button>
            </p>

            {USE_MOCK && (
              <p>
                Demo mode: authentication is simulated. No real account is
                created.
              </p>
            )}
          </section>
        )}

        {page === 'courses' && (
          <CourseCatalog onSelectCourse={openCourse} />
        )}

        {page === 'dashboard' && (
          <StudentDashboard onSelectCourse={openCourse} />
        )}

        {page === 'instructor' && user?.role === 'instructor' && (
          <InstructorCourseBuilder />
        )}

        {page === 'detail' && selectedCourse && (
          <CourseDetail
            course={selectedCourse}
            onBack={() => showPage('courses')}
            onContinue={() => openLearning(selectedCourse)}
          />
        )}

        {page === 'learning' && selectedCourse && (
          <LearningPage
            course={selectedCourse}
            onBack={() => showPage('dashboard')}
          />
        )}
      </main>

      <footer className="lms-footer">
        <p>Axlero LMS - Learn at your own pace.</p>
      </footer>
    </div>
  );
}