import React from 'react';

export default function TopNavbar({ 
  onToggleSidebar, 
  institutionName = 'National Institute of Science & Technology', 
  academicYear = '2024-2025',
  onQuickAction
}) {
  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date());

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 shadow-sm no-print">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          data-testid="toggle-sidebar-button"
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Toggle Navigation Menu"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-none">
              {institutionName}
            </h2>
            <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-navy-50 text-navy-800 border border-navy-200">
              AY {academicYear}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">Academic Administration & Daily Period Tracking Portal</p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Date display */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200">
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="font-medium">{todayFormatted}</span>
        </div>

        {/* Quick action button */}
        <button
          data-testid="quick-take-attendance-btn"
          onClick={() => onQuickAction && onQuickAction('attendance')}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-navy-900 text-white hover:bg-navy-800 shadow-sm transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden sm:inline">Take</span> Attendance
        </button>

        {/* Admin profile circle */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs ring-2 ring-slate-100">
            AD
          </div>
        </div>
      </div>
    </header>
  );
}
