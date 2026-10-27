import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import ConfirmDialog from '../common/ConfirmDialog';

export default function DailyAttendance({ showToast }) {
  const [departments, setDepartments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Attendance grid state
  const [attendanceData, setAttendanceData] = useState(null);
  const [gridStudents, setGridStudents] = useState([]); // Editable working copy
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [unsavedWarning, setUnsavedWarning] = useState(null); // Pending action callback

  // Load initial dropdowns
  useEffect(() => {
    const fetchInit = async () => {
      try {
        const [deptRes, classRes] = await Promise.all([
          api.getDepartments(),
          api.getClasses()
        ]);
        const depts = deptRes.data || [];
        const cls = classRes.data || [];
        setDepartments(depts);
        setClasses(cls);
        if (depts.length > 0) setSelectedDept(depts[0].id);
        if (cls.length > 0) setSelectedClass(cls[0].id);
      } catch (err) {
        console.error('Failed to load classes for attendance:', err);
        showToast?.('Unable to load classes from server', 'error');
      }
    };
    fetchInit();
  }, []);

  // Fetch daily attendance whenever date or class changes (with unsaved changes guard)
  const fetchAttendanceForSelection = async (classId, date) => {
    if (!classId || !date) return;
    try {
      setLoading(true);
      const res = await api.getDailyAttendance(classId, date);
      if (res && res.data) {
        setAttendanceData(res.data);
        // Create deep clone for local editing
        setGridStudents(JSON.parse(JSON.stringify(res.data.students || [])));
        setHasUnsavedChanges(false);
      }
    } catch (err) {
      console.error('Error fetching daily attendance:', err);
      showToast?.('Error retrieving attendance records for selected date', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClass && selectedDate) {
      fetchAttendanceForSelection(selectedClass, selectedDate);
    }
  }, [selectedClass, selectedDate]);

  // Guard for changing class or date with unsaved changes
  const handleDateChange = (newDate) => {
    if (hasUnsavedChanges) {
      setUnsavedWarning(() => () => {
        setSelectedDate(newDate);
      });
    } else {
      setSelectedDate(newDate);
    }
  };

  const handleClassChange = (newClassId) => {
    if (hasUnsavedChanges) {
      setUnsavedWarning(() => () => {
        setSelectedClass(newClassId);
      });
    } else {
      setSelectedClass(newClassId);
    }
  };

  // Toggle single period cell status
  const handleToggleCell = (studentIndex, periodNumber) => {
    setGridStudents(prev => {
      const copy = [...prev];
      const student = { ...copy[studentIndex] };
      const periods = [...student.periods];
      const pIdx = periods.findIndex(p => p.period_number === periodNumber);

      if (pIdx !== -1) {
        const current = periods[pIdx].status;
        let nextStatus;
        // Cycle: null (unmarked) -> PRESENT -> ABSENT -> PRESENT
        if (current === null) nextStatus = 'PRESENT';
        else if (current === 'PRESENT') nextStatus = 'ABSENT';
        else nextStatus = 'PRESENT';

        periods[pIdx] = {
          ...periods[pIdx],
          status: nextStatus
        };

        // Recalculate row counts
        let present = 0;
        let absent = 0;
        periods.forEach(p => {
          if (p.status === 'PRESENT') present++;
          if (p.status === 'ABSENT') absent++;
        });

        student.periods = periods;
        student.present_count = present;
        student.absent_count = absent;
        student.marked_periods = present + absent;
        student.is_complete = (present + absent) === 7;
        copy[studentIndex] = student;
      }
      return copy;
    });
    setHasUnsavedChanges(true);
  };

  // Bulk Actions
  const handleMarkAllPresent = () => {
    setGridStudents(prev => {
      return prev.map(student => {
        const periods = student.periods.map(p => ({ ...p, status: 'PRESENT' }));
        return {
          ...student,
          periods,
          present_count: 7,
          absent_count: 0,
          marked_periods: 7,
          is_complete: true
        };
      });
    });
    setHasUnsavedChanges(true);
    showToast?.('All students marked Present for Periods 1–7', 'info');
  };

  const handleMarkAllAbsent = () => {
    setGridStudents(prev => {
      return prev.map(student => {
        const periods = student.periods.map(p => ({ ...p, status: 'ABSENT' }));
        return {
          ...student,
          periods,
          present_count: 0,
          absent_count: 7,
          marked_periods: 7,
          is_complete: true
        };
      });
    });
    setHasUnsavedChanges(true);
    showToast?.('All students marked Absent for Periods 1–7', 'info');
  };

  // Bulk column actions for a specific period
  const handleBulkColumn = (periodNumber, status) => {
    setGridStudents(prev => {
      return prev.map(student => {
        const periods = student.periods.map(p => {
          if (p.period_number === periodNumber) {
            return { ...p, status };
          }
          return p;
        });

        let present = 0;
        let absent = 0;
        periods.forEach(p => {
          if (p.status === 'PRESENT') present++;
          if (p.status === 'ABSENT') absent++;
        });

        return {
          ...student,
          periods,
          present_count: present,
          absent_count: absent,
          marked_periods: present + absent,
          is_complete: (present + absent) === 7
        };
      });
    });
    setHasUnsavedChanges(true);
    showToast?.(`Period ${periodNumber} set to ${status} for all students`, 'info');
  };

  // Save Attendance to Backend Database
  const handleSaveAttendance = async () => {
    if (!selectedClass || !selectedDate) return;

    // Collect all marked periods to save
    const recordsToSave = [];
    gridStudents.forEach(student => {
      student.periods.forEach(p => {
        if (p.status === 'PRESENT' || p.status === 'ABSENT') {
          recordsToSave.push({
            student_id: student.student_id,
            period_number: p.period_number,
            status: p.status,
            remarks: p.remarks || ''
          });
        }
      });
    });

    if (recordsToSave.length === 0) {
      showToast?.('No attendance entries marked yet to save.', 'warning');
      return;
    }

    try {
      setSaving(true);
      const res = await api.saveDailyAttendance(selectedClass, selectedDate, recordsToSave);
      if (res && res.data) {
        setAttendanceData(res.data);
        setGridStudents(JSON.parse(JSON.stringify(res.data.students || [])));
        setHasUnsavedChanges(false);
        showToast?.(`Attendance successfully saved! (${recordsToSave.length} period records)`, 'success');
      }
    } catch (err) {
      console.error('Failed to save attendance:', err);
      showToast?.(err.message || 'Error saving attendance to database', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Calculation of current live completion percentage
  const totalSlots = gridStudents.length * 7;
  let totalMarked = 0;
  let totalPresent = 0;
  let totalAbsent = 0;

  gridStudents.forEach(s => {
    s.periods.forEach(p => {
      if (p.status === 'PRESENT') { totalMarked++; totalPresent++; }
      if (p.status === 'ABSENT') { totalMarked++; totalAbsent++; }
    });
  });

  const completionPct = totalSlots > 0 ? Number(((totalMarked / totalSlots) * 100).toFixed(1)) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title & Top Save Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Daily Class Attendance</h1>
          <p className="text-sm text-slate-500 mt-1">
            Conduct 7-period daily roll call, apply period-wise bulk actions, and persist verified records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            data-testid="save-attendance-btn"
            onClick={handleSaveAttendance}
            disabled={saving || loading || !hasUnsavedChanges}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold text-white shadow-md transition-all flex items-center gap-2 ${
              hasUnsavedChanges
                ? 'bg-emerald-600 hover:bg-emerald-500 ring-2 ring-emerald-300 animate-pulse'
                : 'bg-slate-400 cursor-not-allowed opacity-80'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            {saving ? 'Saving to Database...' : hasUnsavedChanges ? 'Save Changes' : 'All Changes Saved'}
          </button>
        </div>
      </div>

      {/* Date, Department, and Class Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Attendance Date *</label>
            <input
              type="date"
              data-testid="attendance-date-input"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-600 font-medium"
            />
          </div>

          {/* Department Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-600 bg-white"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.code} — {d.name}</option>
              ))}
            </select>
          </div>

          {/* Class Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Class / Section *</label>
            <select
              data-testid="attendance-class-select"
              value={selectedClass}
              onChange={(e) => handleClassChange(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-600 bg-white font-semibold"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.academic_year})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Status & Bulk Actions Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">
              Students: <strong className="text-slate-800">{gridStudents.length}</strong>
            </span>
            <span className="text-xs text-slate-300">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500">Day Completion:</span>
              <span 
                data-testid="completion-percentage-badge"
                className={`px-2 py-0.5 rounded text-xs font-bold ${
                  completionPct === 100 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                    : completionPct > 0 
                      ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                      : 'bg-slate-100 text-slate-600'
                }`}
              >
                {completionPct}% ({totalMarked}/{totalSlots} slots)
              </span>
            </div>
            {hasUnsavedChanges && (
              <span className="text-xs font-bold text-amber-600 flex items-center gap-1 animate-pulse">
                <span>●</span> Unsaved modifications
              </span>
            )}
          </div>

          {/* Bulk Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="mark-all-present-btn"
              onClick={handleMarkAllPresent}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 transition-colors"
            >
              ✓ Mark All Present (P1–P7)
            </button>
            <button
              type="button"
              data-testid="mark-all-absent-btn"
              onClick={handleMarkAllAbsent}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100 transition-colors"
            >
              ✕ Mark All Absent (P1–P7)
            </button>
            <button
              type="button"
              onClick={() => {
                if (selectedClass && selectedDate) {
                  fetchAttendanceForSelection(selectedClass, selectedDate);
                }
              }}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Reset Unsaved
            </button>
          </div>
        </div>
      </div>

      {/* Daily Attendance 7-Period Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <div className="w-8 h-8 border-4 border-navy-200 border-t-navy-800 rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs">Loading class roster and attendance records...</p>
          </div>
        ) : gridStudents.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <p className="text-sm font-semibold text-slate-600">No active students found in this class.</p>
            <p className="text-xs mt-1">Enroll students into this class using the Students menu first.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table data-testid="daily-attendance-table" className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[11px]">
                  <th className="py-3 px-3 w-16 text-center">#</th>
                  <th className="py-3 px-3 w-28">Roll No</th>
                  <th className="py-3 px-3">Student Name</th>
                  {/* Period Columns 1 to 7 with Column Bulk Controls */}
                  {[1, 2, 3, 4, 5, 6, 7].map((p) => (
                    <th key={p} className="py-2 px-2 text-center w-20 border-l border-slate-200/60">
                      <div className="font-bold text-slate-900">Period {p}</div>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <button
                          type="button"
                          data-testid={`bulk-period-${p}-present`}
                          onClick={() => handleBulkColumn(p, 'PRESENT')}
                          title={`Set Period ${p} All Present`}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 hover:bg-emerald-200 font-mono font-bold"
                        >
                          P
                        </button>
                        <button
                          type="button"
                          data-testid={`bulk-period-${p}-absent`}
                          onClick={() => handleBulkColumn(p, 'ABSENT')}
                          title={`Set Period ${p} All Absent`}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-rose-100 text-rose-800 hover:bg-rose-200 font-mono font-bold"
                        >
                          A
                        </button>
                      </div>
                    </th>
                  ))}
                  <th className="py-3 px-3 text-center w-20 border-l border-slate-200">Present</th>
                  <th className="py-3 px-3 text-center w-20">Absent</th>
                  <th className="py-3 px-3 text-center w-24">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {gridStudents.map((student, sIdx) => (
                  <tr 
                    key={student.student_id} 
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="py-2.5 px-3 text-center text-slate-400 font-mono">
                      {sIdx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      {student.roll_number}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {student.full_name}
                    </td>

                    {/* Periods 1 to 7 Interactive Cells */}
                    {student.periods.map((period) => {
                      const isPresent = period.status === 'PRESENT';
                      const isAbsent = period.status === 'ABSENT';
                      const isUnmarked = period.status === null;

                      return (
                        <td 
                          key={period.period_number} 
                          className="py-2 px-2 text-center border-l border-slate-200/60"
                        >
                          <button
                            type="button"
                            data-testid={`period-toggle-${student.roll_number}-${period.period_number}`}
                            onClick={() => handleToggleCell(sIdx, period.period_number)}
                            title={`Student: ${student.roll_number}, Period ${period.period_number}. Click to toggle status.`}
                            className={`w-12 h-8 rounded-lg font-bold text-xs font-mono transition-all transform active:scale-95 flex items-center justify-center mx-auto shadow-sm ${
                              isPresent
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700 ring-2 ring-emerald-200'
                                : isAbsent
                                  ? 'bg-rose-600 text-white hover:bg-rose-700 ring-2 ring-rose-200'
                                  : 'bg-slate-100 text-slate-400 border border-slate-300 hover:bg-slate-200'
                            }`}
                          >
                            {isPresent ? 'P' : isAbsent ? 'A' : '—'}
                          </button>
                        </td>
                      );
                    })}

                    {/* Present Count */}
                    <td className="py-2.5 px-3 text-center font-bold text-emerald-700 font-mono border-l border-slate-200">
                      {student.present_count}
                    </td>

                    {/* Absent Count */}
                    <td className="py-2.5 px-3 text-center font-bold text-rose-600 font-mono">
                      {student.absent_count}
                    </td>

                    {/* Row Completion Status */}
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        student.is_complete
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : student.marked_periods > 0
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-500'
                      }`}>
                        {student.is_complete ? 'Complete' : `${student.marked_periods}/7`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Unsaved Changes Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!unsavedWarning}
        onClose={() => setUnsavedWarning(null)}
        onConfirm={() => {
          if (unsavedWarning) unsavedWarning();
          setHasUnsavedChanges(false);
          setUnsavedWarning(null);
        }}
        title="Unsaved Attendance Changes"
        message="You have unsaved attendance modifications for this class and date. If you navigate away or switch dates, your unsaved changes will be discarded. Do you wish to discard changes and continue?"
        confirmText="Discard and Continue"
        isDestructive={true}
      />
    </div>
  );
}
