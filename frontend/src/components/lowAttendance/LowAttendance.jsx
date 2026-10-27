import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import Modal from '../common/Modal';

export default function LowAttendance({ showToast }) {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [threshold, setThreshold] = useState(75);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [lowStudents, setLowStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  // Notification template modal
  const [alertStudent, setAlertStudent] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await api.getClasses();
        const cls = res.data || [];
        setClasses(cls);
        if (cls.length > 0) setSelectedClass(cls[0].id);
      } catch (err) {
        console.error(err);
      }
    };
    init();
  }, []);

  const fetchLowAttendance = async () => {
    try {
      setLoading(true);
      const res = await api.getLowAttendanceReport(selectedClass, selectedMonth, threshold);
      setLowStudents(res.data?.students || []);
    } catch (err) {
      console.error(err);
      showToast?.('Error fetching low attendance data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLowAttendance();
  }, [selectedClass, selectedMonth, threshold]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Attendance Shortage & Intervention</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
              Threshold &lt; {threshold}%
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Identify at-risk students failing minimum attendance compliance and generate formal advisory notices.
          </p>
        </div>
      </div>

      {/* Threshold and Filter Selector */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Target Month</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-600 font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Class / Section</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-600 bg-white font-semibold"
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.academic_year})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Minimum Attendance Threshold ({threshold}%)
            </label>
            <div className="flex items-center gap-3 mt-1">
              <input
                type="range"
                min="50"
                max="95"
                step="1"
                data-testid="threshold-slider"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full accent-rose-600 cursor-pointer"
              />
              <span className="font-mono font-bold text-sm text-slate-800 w-12 text-right">{threshold}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Warning Alert Banner */}
      <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-bold text-rose-900">
              {lowStudents.length} Students Currently In Shortage
            </h4>
            <p className="text-xs text-rose-700 mt-0.5">
              These students fall strictly below the required {threshold}% attendance minimum for {selectedMonth}.
            </p>
          </div>
        </div>
      </div>

      {/* Shortage Students Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table data-testid="low-attendance-table" className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[11px]">
                <th className="py-3 px-4">Roll Number</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4 text-center">Working</th>
                <th className="py-3 px-4 text-center">Attended</th>
                <th className="py-3 px-4 text-center">Current %</th>
                <th className="py-3 px-4 text-center">Deficit</th>
                <th className="py-3 px-4 text-right">Advisory Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Scanning database for students under threshold...
                  </td>
                </tr>
              ) : lowStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-emerald-600 font-semibold">
                    ✓ Excellent! All students are currently meeting the {threshold}% attendance threshold.
                  </td>
                </tr>
              ) : (
                lowStudents.map((st) => {
                  const deficit = (threshold - st.attendance_percentage).toFixed(2);
                  return (
                    <tr key={st.student_id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {st.roll_number}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {st.full_name}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {st.class_name}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        {st.working_periods}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">
                        {st.periods_attended}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-rose-600 text-sm">
                        {st.attendance_percentage}%
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-rose-700 font-semibold">
                        -{deficit}%
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          data-testid={`generate-notice-${st.roll_number}`}
                          onClick={() => setAlertStudent(st)}
                          className="px-3 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                        >
                          Generate Advisory Notice
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Advisory Notice Template Modal */}
      <Modal
        isOpen={!!alertStudent}
        onClose={() => setAlertStudent(null)}
        title="Official Attendance Warning Advisory"
        maxWidth="max-w-xl"
      >
        {alertStudent && (
          <div className="space-y-4 text-slate-700 text-xs">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg font-mono leading-relaxed space-y-3">
              <p className="font-bold text-slate-900 border-b pb-2">
                OFFICE OF THE DEAN OF ACADEMICS • ATTENDANCE REGULATION NOTICE
              </p>
              <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
              <p><strong>To:</strong> Parent/Guardian of {alertStudent.full_name} (Roll No: {alertStudent.roll_number})</p>
              <p><strong>Class/Section:</strong> {alertStudent.class_name} ({alertStudent.department_code})</p>
              <p className="pt-2">
                Dear Parent/Guardian,<br />
                This is an official communication regarding your ward's attendance for the month of <strong>{selectedMonth}</strong>.
              </p>
              <div className="p-2.5 bg-white border border-slate-200 rounded my-2">
                <div>• Scheduled Working Periods: <strong>{alertStudent.working_periods}</strong></div>
                <div>• Periods Attended: <strong>{alertStudent.periods_attended}</strong></div>
                <div>• Current Attendance Percentage: <strong className="text-rose-600">{alertStudent.attendance_percentage}%</strong></div>
                <div>• Minimum Statutory Threshold: <strong>{threshold}%</strong></div>
              </div>
              <p>
                As your ward's attendance is below {threshold}%, they are at risk of being disbarred from final semester examinations. Kindly counsel your ward and contact the department head immediately.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(`Attendance Notice for ${alertStudent.full_name}: Current attendance is ${alertStudent.attendance_percentage}%, below statutory threshold ${threshold}%.`);
                  showToast?.('Advisory text copied to clipboard', 'success');
                }}
                className="px-3 py-1.5 font-bold text-navy-800 bg-navy-50 hover:bg-navy-100 rounded-lg transition-colors"
              >
                Copy Text
              </button>
              <button
                type="button"
                onClick={() => setAlertStudent(null)}
                className="px-4 py-1.5 font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
