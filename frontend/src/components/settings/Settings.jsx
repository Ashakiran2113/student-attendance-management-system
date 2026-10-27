import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

export default function Settings({ showToast, onSettingsUpdated }) {
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  // Settings form
  const [institutionName, setInstitutionName] = useState('National Institute of Science & Technology');
  const [academicYear, setAcademicYear] = useState('2024-2025');
  const [threshold, setThreshold] = useState(75);
  const [periodSchedule, setPeriodSchedule] = useState([]);

  // Departments & Classes
  const [departments, setDepartments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [holidays, setHolidays] = useState([]);

  // New Department Form
  const [newDeptCode, setNewDeptCode] = useState('');
  const [newDeptName, setNewDeptName] = useState('');

  // New Class Form
  const [newClassDept, setNewClassDept] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [newClassYear, setNewClassYear] = useState('2024-2025');

  // New Holiday Form
  const [holidayDate, setHolidayDate] = useState('');
  const [holidayName, setHolidayName] = useState('');
  const [holidayDesc, setHolidayDesc] = useState('');

  const loadAll = async () => {
    try {
      setLoading(true);
      const [settingsRes, deptRes, classRes, holidayRes] = await Promise.all([
        api.getSettings(),
        api.getDepartments(),
        api.getClasses(),
        api.getHolidays()
      ]);

      const s = settingsRes.data || {};
      if (s.institution_name) setInstitutionName(s.institution_name);
      if (s.academic_year) setAcademicYear(s.academic_year);
      if (s.attendance_threshold) setThreshold(Number(s.attendance_threshold));
      if (s.period_schedule) setPeriodSchedule(s.period_schedule);

      setDepartments(deptRes.data || []);
      setClasses(classRes.data || []);
      setHolidays(holidayRes.data || []);
      if (deptRes.data?.length > 0) setNewClassDept(deptRes.data[0].id);
    } catch (err) {
      console.error(err);
      showToast?.('Error loading institutional settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleSaveGeneralSettings = async (e) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      await api.updateSettings({
        institution_name: institutionName,
        academic_year: academicYear,
        attendance_threshold: threshold,
        period_schedule: periodSchedule
      });
      showToast?.('System settings persisted successfully', 'success');
      onSettingsUpdated?.({ institutionName, academicYear, threshold });
    } catch (err) {
      showToast?.('Failed to save settings', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddDepartment = async (e) => {
    e.preventDefault();
    if (!newDeptCode || !newDeptName) return;
    try {
      await api.createDepartment({ code: newDeptCode, name: newDeptName });
      showToast?.(`Department ${newDeptCode} created`, 'success');
      setNewDeptCode('');
      setNewDeptName('');
      const res = await api.getDepartments();
      setDepartments(res.data || []);
    } catch (err) {
      showToast?.(err.message || 'Error creating department', 'error');
    }
  };

  const handleAddClass = async (e) => {
    e.preventDefault();
    if (!newClassDept || !newClassName) return;
    try {
      await api.createClass({ department_id: newClassDept, name: newClassName, academic_year: newClassYear });
      showToast?.(`Class ${newClassName} added`, 'success');
      setNewClassName('');
      const res = await api.getClasses();
      setClasses(res.data || []);
    } catch (err) {
      showToast?.(err.message || 'Error creating class', 'error');
    }
  };

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    if (!holidayDate || !holidayName) return;
    try {
      await api.createHoliday({ holiday_date: holidayDate, name: holidayName, description: holidayDesc });
      showToast?.(`Holiday '${holidayName}' recorded`, 'success');
      setHolidayDate('');
      setHolidayName('');
      setHolidayDesc('');
      const res = await api.getHolidays();
      setHolidays(res.data || []);
    } catch (err) {
      showToast?.(err.message || 'Error creating holiday', 'error');
    }
  };

  const handleDeleteHoliday = async (id) => {
    try {
      await api.deleteHoliday(id);
      showToast?.('Holiday removed from calendar', 'info');
      const res = await api.getHolidays();
      setHolidays(res.data || []);
    } catch (err) {
      showToast?.('Failed to delete holiday', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Institutional Configuration & Preferences</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure academic calendars, period durations, department curricula, and attendance compliance thresholds.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-sm">Institution Profile & Regulations</h3>
            <p className="text-xs text-slate-500">Core academic configuration stored in SQLite</p>
          </div>

          <form onSubmit={handleSaveGeneralSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Institution Legal Name</label>
              <input
                type="text"
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-600 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Active Academic Year</label>
                <input
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Default Attendance Threshold (%)</label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-600 font-bold"
                />
              </div>
            </div>

            {/* Seven Period Timetable Display */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Seven-Period Timetable Schedule</label>
              <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 text-xs">
                {periodSchedule.map((p, idx) => (
                  <div key={p.period} className="px-3 py-2 flex items-center justify-between bg-slate-50/50">
                    <span className="font-bold text-slate-800">Period {p.period}</span>
                    <span className="font-mono text-slate-500 text-[11px]">{p.startTime} — {p.endTime}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="w-full py-2 text-xs font-bold text-white bg-navy-900 hover:bg-navy-800 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {savingSettings ? 'Saving...' : 'Save General Settings'}
            </button>
          </form>
        </div>

        {/* Academic Holidays Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-sm">Academic Holidays & Recesses</h3>
            <p className="text-xs text-slate-500">Days excluded from mandatory working period calculations</p>
          </div>

          <form onSubmit={handleAddHoliday} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="date"
              value={holidayDate}
              onChange={(e) => setHolidayDate(e.target.value)}
              required
              className="px-2 py-1.5 text-xs border border-slate-300 rounded-lg"
            />
            <input
              type="text"
              placeholder="Holiday Name"
              value={holidayName}
              onChange={(e) => setHolidayName(e.target.value)}
              required
              className="px-2 py-1.5 text-xs border border-slate-300 rounded-lg"
            />
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg"
            >
              + Add Holiday
            </button>
          </form>

          <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 text-xs">
            {holidays.length === 0 ? (
              <p className="p-4 text-center text-slate-400">No holidays declared.</p>
            ) : (
              holidays.map((h) => (
                <div key={h.id} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <div className="font-bold text-slate-800">{h.name}</div>
                    <div className="text-[11px] font-mono text-slate-400">{h.holiday_date} {h.description && `• ${h.description}`}</div>
                  </div>
                  <button
                    onClick={() => handleDeleteHoliday(h.id)}
                    className="text-rose-600 hover:text-rose-800 font-bold p-1 text-sm"
                    title="Delete holiday"
                  >
                    &times;
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Departments & Classes Management Card */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-sm">Academic Structure: Departments & Classes</h3>
            <p className="text-xs text-slate-500">Configure organizational units and sections</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Departments */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase">Departments</h4>
              <form onSubmit={handleAddDepartment} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Code (e.g. IT)"
                  value={newDeptCode}
                  onChange={(e) => setNewDeptCode(e.target.value)}
                  className="w-24 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg font-mono uppercase"
                  required
                />
                <input
                  type="text"
                  placeholder="Full Department Name"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                  required
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-bold text-white bg-navy-900 hover:bg-navy-800 rounded-lg shrink-0"
                >
                  Add
                </button>
              </form>

              <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 text-xs">
                {departments.map((d) => (
                  <div key={d.id} className="p-2.5 flex items-center justify-between">
                    <div>
                      <strong className="font-mono text-navy-900">{d.code}</strong> — <span className="text-slate-700">{d.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Classes */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase">Classes / Sections</h4>
              <form onSubmit={handleAddClass} className="flex gap-2">
                <select
                  value={newClassDept}
                  onChange={(e) => setNewClassDept(e.target.value)}
                  className="w-28 px-2 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  required
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.code}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Class (e.g. CS-C)"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                  required
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-bold text-white bg-navy-900 hover:bg-navy-800 rounded-lg shrink-0"
                >
                  Add
                </button>
              </form>

              <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 text-xs">
                {classes.map((c) => (
                  <div key={c.id} className="p-2.5 flex items-center justify-between">
                    <div>
                      <strong className="text-slate-900">{c.name}</strong>
                      <span className="text-slate-400 text-[11px] ml-2">({c.department_code || 'Dept'} • {c.academic_year})</span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {c.student_count || 0} students
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
