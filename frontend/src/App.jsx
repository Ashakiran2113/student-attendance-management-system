import React, { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import TopNavbar from './components/layout/TopNavbar';
import Toast from './components/common/Toast';

import Dashboard from './components/dashboard/Dashboard';
import StudentManagement from './components/students/StudentManagement';
import DailyAttendance from './components/attendance/DailyAttendance';
import AttendanceHistory from './components/history/AttendanceHistory';
import MonthlyReports from './components/reports/MonthlyReports';
import LowAttendance from './components/lowAttendance/LowAttendance';
import Settings from './components/settings/Settings';
import DevOpsDashboard from './components/devops/DevOpsDashboard';
import { api } from './services/api';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Institution settings state
  const [institutionName, setInstitutionName] = useState('National Institute of Science & Technology');
  const [academicYear, setAcademicYear] = useState('2024-2025');

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  // Load institution preferences on boot
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await api.getSettings();
        const s = res.data || {};
        if (s.institution_name) setInstitutionName(s.institution_name);
        if (s.academic_year) setAcademicYear(s.academic_year);
      } catch (e) {
        // Fallback defaults in place
      }
    };
    loadSettings();
  }, []);

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={(page) => setCurrentPage(page)} />;
      case 'students':
        return <StudentManagement showToast={showToast} />;
      case 'attendance':
        return <DailyAttendance showToast={showToast} />;
      case 'history':
        return <AttendanceHistory showToast={showToast} />;
      case 'reports':
        return <MonthlyReports showToast={showToast} />;
      case 'lowAttendance':
        return <LowAttendance showToast={showToast} />;
      case 'settings':
        return (
          <Settings 
            showToast={showToast} 
            onSettingsUpdated={({ institutionName: n, academicYear: y }) => {
              if (n) setInstitutionName(n);
              if (y) setAcademicYear(y);
            }} 
          />
        );
      case 'devops':
        return <DevOpsDashboard showToast={showToast} />;
      default:
        return <Dashboard onNavigate={(page) => setCurrentPage(page)} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Toast notifications */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Responsive Navigation Sidebar */}
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col flex-1 min-h-screen">
        <TopNavbar
          onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
          institutionName={institutionName}
          academicYear={academicYear}
          onQuickAction={(target) => setCurrentPage(target)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderCurrentPage()}
        </main>
      </div>
    </div>
  );
}
