import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

export default function Dashboard({ onNavigate }) {
  const [metricsData, setMetricsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDashboardMetrics();
      if (res && res.data) {
        setMetricsData(res.data);
      }
    } catch (err) {
      console.error('Error loading dashboard metrics:', err);
      setError('Unable to fetch live dashboard metrics. Please check server connectivity.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <div className="w-10 h-10 border-4 border-navy-200 border-t-navy-800 rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium">Loading live database metrics...</p>
      </div>
    );
  }

  const { metrics, recent_activity, monthly_trends, departments } = metricsData || {
    metrics: {
      total_active_students: 0,
      today_completion_percentage: 0,
      average_attendance_percentage: 0,
      students_below_threshold: 0,
      attendance_threshold: 75
    },
    recent_activity: [],
    monthly_trends: [],
    departments: []
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Executive Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time attendance intelligence, student enrollments, and academic health metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboard}
            data-testid="refresh-dashboard-btn"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Data
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchDashboard} className="underline font-semibold ml-2">Retry</button>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Active Students */}
        <div 
          data-testid="metric-total-students"
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Active Students</span>
            <div className="w-9 h-9 rounded-lg bg-navy-50 text-navy-800 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{metrics.total_active_students}</span>
            <span className="text-xs font-medium text-slate-400">enrolled</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <span className="text-emerald-600 font-semibold">100% Verified</span> in active classes
          </p>
        </div>

        {/* Card 2: Today's Completion */}
        <div 
          data-testid="metric-today-completion"
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Attendance</span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{metrics.today_completion_percentage}%</span>
            <span className="text-xs font-medium text-slate-400">marked</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div 
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(metrics.today_completion_percentage, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Card 3: Average Attendance */}
        <div 
          data-testid="metric-average-attendance"
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Average Attendance</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{metrics.average_attendance_percentage}%</span>
            <span className="text-xs font-medium text-slate-400">monthly avg</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <span className="text-slate-600 font-semibold">Min Threshold: {metrics.attendance_threshold}%</span>
          </p>
        </div>

        {/* Card 4: Students Below Threshold */}
        <div 
          data-testid="metric-students-shortage"
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Attendance Shortage</span>
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-600">{metrics.students_below_threshold}</span>
            <span className="text-xs font-medium text-slate-400">students below {metrics.attendance_threshold}%</span>
          </div>
          <button 
            onClick={() => onNavigate('lowAttendance')}
            className="mt-2 text-xs text-rose-600 font-bold hover:underline flex items-center gap-1"
          >
            Review At-Risk Students &rarr;
          </button>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-slate-900 rounded-xl p-5 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold">Quick Administrative Actions</h3>
            <p className="text-xs text-slate-300 mt-0.5">Frequent workflows for daily attendance management and compliance</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              data-testid="action-take-attendance"
              onClick={() => onNavigate('attendance')}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Mark Daily Attendance (Periods 1–7)
            </button>
            <button
              data-testid="action-add-student"
              onClick={() => onNavigate('students')}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Manage Students
            </button>
            <button
              data-testid="action-view-reports"
              onClick={() => onNavigate('reports')}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Monthly Reports & CSV
            </button>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Trends & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Attendance Trends Visual Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Attendance Trends</h3>
              <p className="text-xs text-slate-500">Day-by-day attendance rate across recent working days</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">Database Records</span>
          </div>

          <div className="mt-5 space-y-3">
            {monthly_trends.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No historical trends recorded yet.</p>
            ) : (
              monthly_trends.map((t, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">{t.date}</span>
                    <span className="font-bold text-slate-900">{t.attendancePercentage}% Present</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className={`h-2.5 rounded-full transition-all duration-300 ${
                        t.attendancePercentage >= 75 ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(t.attendancePercentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Attendance Activity */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Recent Attendance Activity</h3>
              <p className="text-xs text-slate-500">Latest class sessions recorded in SQLite</p>
            </div>
            <button 
              onClick={() => onNavigate('history')}
              className="text-xs text-navy-800 hover:text-navy-950 font-bold hover:underline"
            >
              View Full History &rarr;
            </button>
          </div>

          <div className="mt-3 divide-y divide-slate-100">
            {recent_activity.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No attendance sessions recorded yet.</p>
            ) : (
              recent_activity.map((act, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">{act.department_code} • {act.class_name}</span>
                      <span className="text-[11px] text-slate-400">({act.attendance_date})</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {act.students_marked} students marked
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {act.present_count} P
                    </span>
                    <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-rose-50 text-rose-700 border border-rose-200">
                      {act.absent_count} A
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
