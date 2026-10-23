import { mockCourses, mockEnrollments } from './mockData';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

function authHeaders() {
  const token = sessionStorage.getItem('axleroToken');

  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
}

async function request(url, options = {}) {
  if (USE_MOCK) {
    return mockRequest(url, options);
  }

  // Automatically combine default headers, auth headers, and custom options
  const headers = {
    'Content-Type': 'application/json',
    ...authHeaders(),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}

async function mockRequest(url, options = {}) {
  const method = options.method || 'GET';

  // GET /api/courses
  if (url === '/courses' && method === 'GET') {
    return { courses: mockCourses };
  }

  // GET /api/courses/:id
  const courseMatch = url.match(/^\/courses\/([^/]+)$/);

  if (courseMatch && method === 'GET') {
    const course = mockCourses.find(
      (item) => item._id === courseMatch[1]
    );

    if (!course) {
      throw new Error('Course not found');
    }

    return { course };
  }

  // POST /api/courses/:id/enroll
  const enrollMatch = url.match(/^\/courses\/([^/]+)\/enroll$/);

  if (enrollMatch && method === 'POST') {
    const course = mockCourses.find(
      (item) => item._id === enrollMatch[1]
    );

    if (!course) {
      throw new Error('Course not found');
    }

    const alreadyEnrolled = mockEnrollments.some(
      (item) =>
        item.courseId === course._id &&
        item.userId === 'mock-student'
    );

    if (alreadyEnrolled) {
      return { message: 'You are already enrolled in this course.' };
    }

    mockEnrollments.push({
      _id: `enrollment-${course._id}`,
      courseId: course._id,
      userId: 'mock-student',
      course,
      progress: 0,
    });

    return { message: 'Successfully enrolled in the course!' };
  }

  // GET /api/enrollments/me
  if (url === '/enrollments/me' && method === 'GET') {
    return {
      enrollments: mockEnrollments.filter(
        (item) => item.userId === 'mock-student'
      ),
    };
  }

  throw new Error(`Mock route not found: ${method} ${url}`);
}

export async function getCourses() {
  return request('/courses');
}

export async function getCourseById(id) {
  const data = await request(`/courses/${id}`);
  return data.course;
}

export async function enrollInCourse(id) {
  return request(`/courses/${id}/enroll`, {
    method: 'POST',
  });
}

export async function getMyEnrollments() {
  const data = await request('/enrollments/me');
  return data.enrollments || [];
}