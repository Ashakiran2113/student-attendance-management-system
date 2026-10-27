import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

export default function AttendanceHistory({ showToast }) {
  const [records, setRecords] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Dropdown lists
  const [classes, setClasses] = useState([]);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [deptRes, classRes] = await Promise.all([
          api.getDepartments(),
          api.getClasses()
        ]);
        setDepartments(deptRes.data || []);
        setClasses(classRes.data || []);
      } catch (err) {
        console.error('Failed to load filter options:', err);
      }
    };
    fetchOptions();
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (selectedClass) params.class_id = selectedClass;
      if (selectedDept) params.department_id = selectedDept;
      if (selectedPeriod) params.period_number = selectedPeriod;
      if (selectedStatus) params.status = selectedStatus;
      params.limit = 150;

      const res = await api.getAttendanceHistory(params);
      setRecords(res.records || []);
      setTotalCount(res.total || 0);
    } catch (err) {
      console.error('Failed to fetch attendance history:', err);
      showToast?.('Error loading attendance history', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilter = (e) => {
    e.preventDefault();
    fetchHistory();
  };

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedClass('');
    setSelectedDept('');
    setSelectedPeriod('');
    setSelectedStatus('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Title */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Attendance Audit Log & History</h1>
        <p className="text-sm text-slate-500 mt-1">
          Trace period-wise historical records, verify modifications, and audit academic attendance trails.
        </p>
      </div>

      {/* Filter Form */}
      <form onSubmit={handleApplyFilter} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Start Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Start Date</label>
            <input
              type="date"
              data-testid="history-start-date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-600"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">End Date</label>
            <input
              type="date"
              data-testid="history-end-date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-600"
            />
          </div>

          {/* Department */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-600 bg-white"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.code}</option>
              ))}
            </select>
          </div>

          {/* Class */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Class / Section</label>
            <select
              data-testid="history-class-select"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-600 bg-white"
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Period */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Period</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-600 bg-white"
            >
              <option value="">All Periods (1–7)</option>
              {[1, 2, 3, 4, 5, 6, 7].map(p => (
                <option key={p} value={p}>Period {p}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-600 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="PRESENT">Present</option>
              <option value="ABSENT">Absent</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <span className="text-xs text-slate-500">
            Total records found: <strong className="text-slate-800">{totalCount}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-1 text-xs text-slate-600 hover:text-slate-800"
            >
              Reset
            </button>
            <button
              type="submit"
              data-testid="filter-history-submit"
              className="px-4 py-1.5 text-xs font-bold rounded-lg bg-navy-900 text-white hover:bg-navy-800 transition-colors"
            >
              Filter Records
            </button>
          </div>
        </div>
      </form>

      {/* History Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table data-testid="history-table" className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[11px]">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Roll Number</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Dept</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Recorded At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading historical attendance records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No historical records found matching filter criteria.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-800">
                      {r.attendance_date}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-900">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-[11px]">
                        Period {r.period_number}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-900 font-semibold">
                      {r.roll_number}
                    </td>
                    <td className="py-2.5 px-4 text-slate-800 font-medium">
                      {r.student_name}
                    </td>
                    <td className="py-2.5 px-4 text-slate-700">
                      {r.class_name}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500">
                      {r.department_code}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.status === 'PRESENT'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-400 text-[11px] font-mono">
                      {r.updated_at || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
