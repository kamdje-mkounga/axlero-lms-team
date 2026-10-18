
import { useState } from 'react';
import CourseCatalog from './pages/CourseCatalog';
import CourseDetail from './pages/CourseDetail';
import StudentDashboard from './pages/StudentDashboard';
import './App.css';

export default function App() {
  const [page, setPage] = useState('courses');
  const [selectedCourse, setSelectedCourse] = useState(null);

  function openCourse(course) {
    setSelectedCourse(course);
    setPage('detail');
  }

  function showPage(nextPage) {
    setSelectedCourse(null);
    setPage(nextPage);
  }

  return (
    <div className="lms-app">
      <header className="lms-header">
        <h1>Axlero LMS</h1>

        <nav aria-label="Student navigation">
          <button type="button" onClick={() => showPage('courses')}>
            Course Catalog
          </button>

          <button type="button" onClick={() => showPage('dashboard')}>
            My Learning
          </button>
        </nav>
      </header>

      <main>
        {page === 'courses' && (
          <CourseCatalog onSelectCourse={openCourse} />
        )}

        {page === 'dashboard' && (
          <StudentDashboard onSelectCourse={openCourse} />
        )}

        {page === 'detail' && selectedCourse && (
          <CourseDetail
            course={selectedCourse}
            onBack={() => showPage('courses')}
          />
        )}
      </main>

      <footer className="lms-footer">
        <p>Axlero LMS — Learn at your own pace.</p>
      </footer>
    </div>
  );
}
