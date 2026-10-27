import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import Modal from '../common/Modal';

export default function MonthlyReports({ showToast }) {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Student drill-down modal
  const [selectedStudentReport, setSelectedStudentReport] = useState(null);
  const [loadingStudent, setLoadingStudent] = useState(false);

  // Filter / Search inside table
  const [tableSearch, setTableSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const res = await api.getClasses();
        const cls = res.data || [];
        setClasses(cls);
        if (cls.length > 0) setSelectedClass(cls[0].id);
      } catch (err) {
        console.error('Failed to load classes:', err);
      }
    };
    loadClasses();
  }, []);

  const fetchMonthlyReport = async (classId, month) => {
    try {
      setLoading(true);
      const res = await api.getMonthlyReport(classId, month);
      if (res && res.data) {
        setReportData(res.data);
      }
    } catch (err) {
      console.error('Failed to load monthly report:', err);
      showToast?.('Error loading monthly attendance report', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedMonth) {
      fetchMonthlyReport(selectedClass, selectedMonth);
    }
  }, [selectedClass, selectedMonth]);

  const handleExportCsv = () => {
    try {
      const url = api.getCsvExportUrl(selectedClass, selectedMonth);
      window.open(url, '_blank');
      showToast?.('Downloading monthly attendance CSV report...', 'info');
    } catch (err) {
      showToast?.('Failed to initiate CSV download', 'error');
    }
  };

  const handleOpenStudentDetail = async (studentId) => {
    try {
      setLoadingStudent(true);
      const res = await api.getStudentReport(studentId, selectedMonth);
      if (res && res.data) {
        setSelectedStudentReport(res.data);
      }
    } catch (err) {
      console.error('Failed to load student breakdown:', err);
      showToast?.('Error loading detailed student report', 'error');
    } finally {
      setLoadingStudent(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter students
  const filteredStudents = (reportData?.students || []).filter(s => {
    const matchesSearch = !tableSearch || 
      s.roll_number.toLowerCase().includes(tableSearch.toLowerCase()) ||
      s.full_name.toLowerCase().includes(tableSearch.toLowerCase());
    const matchesStatus = !statusFilter || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Printable Official Header (only shown during print) */}
      <div className="hidden print-only mb-6 text-center border-b pb-4">
        <h1 className="text-xl font-bold uppercase">National Institute of Science & Technology</h1>
        <h2 className="text-sm font-semibold">Official Academic Attendance Performance Transcript</h2>
        <p className="text-xs text-slate-600 mt-1">
          Month: {selectedMonth} • Class: {classes.find(c => c.id === Number(selectedClass))?.name || 'All'} • Generated: {new Date().toLocaleDateString()}
        </p>
      </div>

      {/* Screen Title & Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 no-print">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Monthly Attendance Analysis & Transcripts</h1>
          <p className="text-sm text-slate-500 mt-1">
            Aggregate working period calculations, shortage evaluations, and institutional compliance reports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            data-testid="export-csv-btn"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
          <button
            onClick={handlePrint}
            data-testid="print-report-btn"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Report
          </button>
        </div>
      </div>

      {/* Class & Month Selectors */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm no-print space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Month selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Target Month *</label>
            <input
              type="month"
              data-testid="report-month-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-600 font-semibold"
            />
          </div>

          {/* Class selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Class / Section</label>
            <select
              data-testid="report-class-select"
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

          {/* In-table Search */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Quick Search</label>
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Filter by roll no or name..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-600"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Attendance Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-600 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="NORMAL">Normal (>= 75%)</option>
              <option value="SHORTAGE">Shortage (&lt; 75%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Aggregate KPI Summary Cards */}
      {reportData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Enrolled Students</span>
            <div className="mt-1 text-2xl font-extrabold text-slate-900">{reportData.total_students}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Working Periods</span>
            <div className="mt-1 text-2xl font-extrabold text-slate-900">{reportData.scheduled_working_periods}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Class Average</span>
            <div className="mt-1 text-2xl font-extrabold text-emerald-600">{reportData.average_attendance_percentage}%</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Shortage Students</span>
            <div className="mt-1 text-2xl font-extrabold text-rose-600">{reportData.low_attendance_count}</div>
          </div>
        </div>
      )}

      {/* Monthly Report Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table data-testid="monthly-report-table" className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[11px]">
                <th className="py-3 px-4">Roll Number</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4 text-center">Working Periods</th>
                <th className="py-3 px-4 text-center">Periods Attended</th>
                <th className="py-3 px-4 text-center">Periods Absent</th>
                <th className="py-3 px-4 text-center">Attendance %</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right no-print">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Computing monthly attendance aggregates...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No records found for the selected month and class.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st) => (
                  <tr 
                    key={st.student_id} 
                    data-testid={`report-row-${st.roll_number}`}
                    className={`hover:bg-slate-50/70 transition-colors ${st.status === 'SHORTAGE' ? 'bg-rose-50/30' : ''}`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {st.roll_number}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {st.full_name}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {st.class_name}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-700">
                      {st.working_periods}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-emerald-700">
                      {st.periods_attended}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-rose-600">
                      {st.periods_absent}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span 
                        data-testid={`report-percentage-${st.roll_number}`}
                        className={`font-mono font-extrabold text-sm ${
                          st.status === 'SHORTAGE' ? 'text-rose-600' : 'text-emerald-700'
                        }`}
                      >
                        {st.attendance_percentage}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        st.status === 'SHORTAGE'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}>
                        {st.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right no-print">
                      <button
                        data-testid={`view-detail-${st.roll_number}`}
                        onClick={() => handleOpenStudentDetail(st.student_id)}
                        className="text-navy-700 hover:text-navy-900 font-bold hover:underline"
                      >
                        Breakdown &rarr;
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Student Attendance Modal */}
      <Modal
        isOpen={!!selectedStudentReport}
        onClose={() => setSelectedStudentReport(null)}
        title={`Attendance Breakdown — ${selectedStudentReport?.student?.full_name} (${selectedStudentReport?.student?.roll_number})`}
        maxWidth="max-w-3xl"
      >
        {selectedStudentReport && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Working Periods</span>
                <p className="font-mono font-bold text-base text-slate-800">{selectedStudentReport.scheduled_working_periods}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Attended</span>
                <p className="font-mono font-bold text-base text-emerald-700">{selectedStudentReport.periods_attended}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Absent</span>
                <p className="font-mono font-bold text-base text-rose-600">{selectedStudentReport.periods_absent}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Final %</span>
                <p className={`font-mono font-extrabold text-base ${selectedStudentReport.status === 'SHORTAGE' ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {selectedStudentReport.attendance_percentage}%
                </p>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100/80 sticky top-0 font-bold text-slate-700">
                  <tr>
                    <th className="py-2 px-3">Date</th>
                    {[1, 2, 3, 4, 5, 6, 7].map(p => (
                      <th key={p} className="py-2 px-2 text-center">P{p}</th>
                    ))}
                    <th className="py-2 px-3 text-center">Attended</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium font-mono text-[11px]">
                  {selectedStudentReport.daily_breakdown.map((row) => (
                    <tr key={row.date} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-semibold text-slate-800">{row.date}</td>
                      {[1, 2, 3, 4, 5, 6, 7].map(p => {
                        const status = row.periods[p];
                        return (
                          <td key={p} className="py-2 px-2 text-center">
                            {status === 'PRESENT' ? (
                              <span className="text-emerald-600 font-bold">P</span>
                            ) : status === 'ABSENT' ? (
                              <span className="text-rose-600 font-bold">A</span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="py-2 px-3 text-center font-bold text-slate-800">
                        {row.present}/7
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedStudentReport(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Close Transcript
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
