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

  // POST /courses
  if (url === '/courses' && method === 'POST') {
    const newCourse = {
      _id: `course-${Date.now()}`,
      id: `course-${Date.now()}`,
      ...JSON.parse(options.body || '{}'),
      createdAt: new Date().toISOString(),
    };
    mockCourses.push(newCourse);
    return {
      success: true,
      message: 'Course created successfully',
      data: newCourse,
    };
  }

  // PUT /courses/:id
  const updateMatch = url.match(/^\/courses\/([^/]+)$/);
  if (updateMatch && method === 'PUT') {
    const courseIndex = mockCourses.findIndex(
      (item) => (item.id || item._id) === updateMatch[1]
    );
    if (courseIndex === -1) {
      throw new Error('Course not found');
    }
    const updates = JSON.parse(options.body || '{}');
    mockCourses[courseIndex] = {
      ...mockCourses[courseIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return {
      success: true,
      message: 'Course updated successfully',
      data: mockCourses[courseIndex],
    };
  }

  // DELETE /courses/:id
  if (updateMatch && method === 'DELETE') {
    const courseIndex = mockCourses.findIndex(
      (item) => (item.id || item._id) === updateMatch[1]
    );
    if (courseIndex === -1) {
      throw new Error('Course not found');
    }
    mockCourses.splice(courseIndex, 1);
    return {
      success: true,
      message: 'Course deleted successfully',
    };
  }

  // POST /api/enrollments or legacy POST /api/courses/:id/enroll
  const enrollMatch = url.match(/^\/courses\/([^/]+)\/enroll$/);
  if ((url === '/enrollments' || enrollMatch) && method === 'POST') {
    const body = options.body ? JSON.parse(options.body) : {};
    const courseId = body.courseId || (enrollMatch ? enrollMatch[1] : null);

    const course = mockCourses.find(
      (item) => (item._id || item.id) === courseId
    );

    if (!course) {
      throw new Error('Course not found');
    }

    const alreadyEnrolled = mockEnrollments.some(
      (item) =>
        (item.courseId === courseId || item.course?._id === courseId || item.course?.id === courseId) &&
        item.userId === 'mock-student'
    );

    if (alreadyEnrolled) {
      return { message: 'You are already enrolled in this course.' };
    }

    mockEnrollments.push({
      _id: `enrollment-${courseId}`,
      courseId,
      userId: 'mock-student',
      course,
      progress: 0,
    });

    return {
      success: true,
      message: 'Successfully enrolled in course',
    };
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
  const data = await request('/courses');
  return {
    courses: data.data || data.courses || [],
    ...data,
  };
}

export async function getCourseById(id) {
  const data = await request(`/courses/${id}`);
  return data.data || data.course;
}

export async function enrollInCourse(id) {
  return request('/enrollments', {
    method: 'POST',
    body: JSON.stringify({ courseId: id }),
  });
}

export async function getMyEnrollments() {
  const data = await request('/enrollments/me');
  return data.data || data.enrollments || [];
}

export async function createCourse(courseData) {
  const data = await request('/courses', {
    method: 'POST',
    body: JSON.stringify(courseData),
  });

  return data.data || data;
}

export async function updateCourse(id, courseData) {
  const data = await request(`/courses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(courseData),
  });

  return data.data || data;
}

export async function deleteCourse(id) {
  return request(`/courses/${id}`, {
    method: 'DELETE',
  });
}