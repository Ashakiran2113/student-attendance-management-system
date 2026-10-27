import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import Modal from '../common/Modal';
import ConfirmDialog from '../common/ConfirmDialog';

export default function StudentManagement({ showToast }) {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortBy, setSortBy] = useState('roll_number');
  const [sortOrder, setSortOrder] = useState('ASC');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    roll_number: '',
    full_name: '',
    department_id: '',
    class_id: '',
    academic_year: '2024-2025',
    email: '',
    phone: ''
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Confirm Deactivate Dialog
  const [deactivateTarget, setDeactivateTarget] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [deptsRes, classesRes] = await Promise.all([
        api.getDepartments(),
        api.getClasses()
      ]);
      setDepartments(deptsRes.data || []);
      setClasses(classesRes.data || []);
      await fetchStudentsList();
    } catch (err) {
      console.error('Error fetching student initial data:', err);
      showToast?.('Failed to load students data from server', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsList = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (selectedDept) params.department_id = selectedDept;
      if (selectedClass) params.class_id = selectedClass;
      if (selectedStatus !== '') params.is_active = selectedStatus;
      params.sort_by = sortBy;
      params.sort_order = sortOrder;

      const res = await api.getStudents(params);
      setStudents(res.data || []);
    } catch (err) {
      console.error('Error filtering students:', err);
      showToast?.('Error searching students', 'error');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    fetchStudentsList();
  }, [search, selectedDept, selectedClass, selectedStatus, sortBy, sortOrder]);

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormData({
      roll_number: '',
      full_name: '',
      department_id: departments[0]?.id || '',
      class_id: classes[0]?.id || '',
      academic_year: '2024-2025',
      email: '',
      phone: ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      roll_number: student.roll_number,
      full_name: student.full_name,
      department_id: student.department_id,
      class_id: student.class_id,
      academic_year: student.academic_year || '2024-2025',
      email: student.email || '',
      phone: student.phone || ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmitStudent = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.roll_number || !formData.full_name || !formData.department_id || !formData.class_id) {
      setFormError('Roll number, Full name, Department, and Class are required.');
      return;
    }

    try {
      setSubmitting(true);
      if (editingStudent) {
        await api.updateStudent(editingStudent.id, formData);
        showToast?.('Student profile updated successfully', 'success');
      } else {
        await api.createStudent(formData);
        showToast?.('New student enrolled successfully', 'success');
      }
      setIsModalOpen(false);
      fetchStudentsList();
    } catch (err) {
      setFormError(err.message || 'Error saving student record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (student) => {
    if (student.is_active === 1) {
      // Prompt confirmation before deactivating
      setDeactivateTarget(student);
    } else {
      // Directly activate
      try {
        await api.setStudentStatus(student.id, 1);
        showToast?.(`Student ${student.roll_number} reactivated`, 'success');
        fetchStudentsList();
      } catch (err) {
        showToast?.('Failed to activate student', 'error');
      }
    }
  };

  const confirmDeactivate = async () => {
    if (!deactivateTarget) return;
    try {
      const res = await api.deleteStudent(deactivateTarget.id);
      showToast?.(res.message || `Student ${deactivateTarget.roll_number} status updated`, 'info');
      fetchStudentsList();
    } catch (err) {
      showToast?.('Failed to deactivate student', 'error');
    } finally {
      setDeactivateTarget(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Student Directory & Enrollment</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage academic enrollments, roll numbers, sections, and active statuses.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          data-testid="add-student-btn"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-navy-900 text-white hover:bg-navy-800 shadow-sm transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Student
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search box */}
          <div className="lg:col-span-2 relative">
            <input
              type="text"
              data-testid="student-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Roll No, Name or Email..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-600 focus:border-navy-600"
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Department Filter */}
          <div>
            <select
              data-testid="filter-department"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-600 focus:border-navy-600 bg-white"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
              ))}
            </select>
          </div>

          {/* Class Filter */}
          <div>
            <select
              data-testid="filter-class"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-600 focus:border-navy-600 bg-white"
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              data-testid="filter-status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-600 focus:border-navy-600 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="1">Active Only</option>
              <option value="0">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Results summary & sorting */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>Found <strong className="text-slate-800">{students.length}</strong> enrolled students</span>
          <div className="flex items-center gap-2">
            <span>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="py-1 px-2 text-xs border border-slate-200 rounded bg-slate-50 text-slate-700"
            >
              <option value="roll_number">Roll Number</option>
              <option value="full_name">Student Name</option>
              <option value="class_name">Class</option>
            </select>
            <button
              onClick={() => setSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC')}
              className="p-1 rounded hover:bg-slate-100 text-slate-600 font-bold"
              title="Toggle sort direction"
            >
              {sortOrder === 'ASC' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table data-testid="students-table" className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Roll Number</th>
                <th className="py-3.5 px-4">Full Name</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Class</th>
                <th className="py-3.5 px-4">Academic Year</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No students found matching current filters.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr 
                    key={student.id} 
                    data-testid={`student-row-${student.roll_number}`}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                      {student.roll_number}
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-semibold">
                      {student.full_name}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {student.department_code || student.department_name}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-semibold">
                      {student.class_name}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {student.academic_year}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      <div>{student.email || '—'}</div>
                      <div className="text-[11px] text-slate-400">{student.phone}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        student.is_active === 1
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {student.is_active === 1 ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        data-testid={`edit-student-${student.roll_number}`}
                        onClick={() => handleOpenEdit(student)}
                        className="text-navy-700 hover:text-navy-900 font-semibold hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        data-testid={`toggle-status-${student.roll_number}`}
                        onClick={() => handleToggleStatus(student)}
                        className={`font-semibold hover:underline ${
                          student.is_active === 1 ? 'text-amber-600 hover:text-amber-800' : 'text-emerald-600 hover:text-emerald-800'
                        }`}
                      >
                        {student.is_active === 1 ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStudent ? `Edit Student — ${editingStudent.roll_number}` : 'Enroll New Student'}
      >
        <form onSubmit={handleSubmitStudent} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Roll Number *</label>
              <input
                type="text"
                data-testid="input-roll-number"
                value={formData.roll_number}
                onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                placeholder="e.g. CS-009"
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-600 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                data-testid="input-full-name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="e.g. Rahul Sharma"
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Department *</label>
              <select
                data-testid="select-department"
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-600 bg-white"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.code} — {d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Class / Section *</label>
              <select
                data-testid="select-class"
                value={formData.class_id}
                onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-600 bg-white"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.academic_year})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Academic Year</label>
              <input
                type="text"
                value={formData.academic_year}
                onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                placeholder="2024-2025"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="student@campus.edu"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-600"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="save-student-btn"
              disabled={submitting}
              className="px-4 py-2 text-xs font-bold text-white rounded-lg bg-navy-900 hover:bg-navy-800 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingStudent ? 'Update Student' : 'Enroll Student'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Deactivation Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={confirmDeactivate}
        title="Confirm Student Deactivation"
        message={`Are you sure you want to deactivate ${deactivateTarget?.full_name} (${deactivateTarget?.roll_number})? Notice: In accordance with academic audit guidelines, historical attendance records for this student will be completely preserved and will not be erased.`}
        confirmText="Deactivate Student"
        isDestructive={true}
      />
    </div>
  );
}
