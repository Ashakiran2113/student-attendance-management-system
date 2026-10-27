// API Service Layer for Student Attendance Management System
const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const res = await fetch(url, config);
    if (!res.ok) {
      let errorMsg = `Server error ${res.status}`;
      try {
        const errJson = await res.json();
        errorMsg = errJson.error?.message || errJson.message || errorMsg;
      } catch (e) {
        // Non-JSON error
      }
      const error = new Error(errorMsg);
      error.status = res.status;
      throw error;
    }
    return await res.json();
  } catch (err) {
    // If backend isn't reachable (e.g. running frontend in standalone preview), log and rethrow
    console.warn(`API request to ${endpoint} failed:`, err.message);
    throw err;
  }
}

export const api = {
  // Health
  checkHealth: () => request('/health'),

  // Dashboard
  getDashboardMetrics: () => request('/dashboard/metrics'),

  // Students
  getStudents: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/students${query ? `?${query}` : ''}`);
  },
  getStudentById: (id) => request(`/students/${id}`),
  createStudent: (data) => request('/students', { method: 'POST', body: JSON.stringify(data) }),
  updateStudent: (id, data) => request(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  setStudentStatus: (id, is_active) => request(`/students/${id}/status`, { method: 'PATCH', body: JSON.stringify({ is_active }) }),
  deleteStudent: (id) => request(`/students/${id}`, { method: 'DELETE' }),

  // Daily Attendance
  getDailyAttendance: (classId, date) => request(`/attendance/daily?class_id=${classId}&date=${date}`),
  saveDailyAttendance: (classId, date, records) => 
    request('/attendance/bulk', {
      method: 'POST',
      body: JSON.stringify({ class_id: classId, attendance_date: date, records })
    }),
  getAttendanceHistory: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/attendance/history${query ? `?${query}` : ''}`);
  },

  // Reports
  getMonthlyReport: (classId, month, threshold) => {
    const params = new URLSearchParams();
    if (classId) params.append('class_id', classId);
    if (month) params.append('month', month);
    if (threshold) params.append('threshold', threshold);
    return request(`/reports/monthly?${params.toString()}`);
  },
  getStudentReport: (id, month) => {
    const params = month ? `?month=${month}` : '';
    return request(`/reports/student/${id}${params}`);
  },
  getLowAttendanceReport: (classId, month, threshold) => {
    const params = new URLSearchParams();
    if (classId) params.append('class_id', classId);
    if (month) params.append('month', month);
    if (threshold) params.append('threshold', threshold);
    return request(`/reports/low-attendance?${params.toString()}`);
  },
  getCsvExportUrl: (classId, month, threshold) => {
    const params = new URLSearchParams();
    if (classId) params.append('class_id', classId);
    if (month) params.append('month', month);
    if (threshold) params.append('threshold', threshold);
    return `${API_BASE}/reports/export/csv?${params.toString()}`;
  },

  // Settings, Departments & Classes
  getSettings: () => request('/settings'),
  updateSettings: (data) => request('/settings', { method: 'PUT', body: JSON.stringify(data) }),
  getDepartments: () => request('/settings/departments'),
  createDepartment: (data) => request('/settings/departments', { method: 'POST', body: JSON.stringify(data) }),
  getClasses: (departmentId) => {
    const query = departmentId ? `?department_id=${departmentId}` : '';
    return request(`/settings/classes${query}`);
  },
  createClass: (data) => request('/settings/classes', { method: 'POST', body: JSON.stringify(data) }),
  getHolidays: () => request('/settings/holidays'),
  createHoliday: (data) => request('/settings/holidays', { method: 'POST', body: JSON.stringify(data) }),
  deleteHoliday: (id) => request(`/settings/holidays/${id}`, { method: 'DELETE' })
};
