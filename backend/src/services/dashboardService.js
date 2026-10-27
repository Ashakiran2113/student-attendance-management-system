const { get, all } = require('../config/database');
const { DEFAULT_ATTENDANCE_THRESHOLD, PERIODS_PER_DAY } = require('../config/constants');
const reportService = require('./reportService');

class DashboardService {
  async getDashboardMetrics() {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = today.substring(0, 7);

    // 1. Total Active Students
    const studentCountRow = await get(
      'SELECT COUNT(*) as total_active FROM students WHERE is_active = 1'
    );
    const totalActiveStudents = studentCountRow ? studentCountRow.total_active : 0;

    // 2. Today's Attendance Completion Percentage
    // Expected attendance slots today across all active students = totalActiveStudents * PERIODS_PER_DAY
    const todayMarkedRow = await get(
      'SELECT COUNT(*) as marked_slots FROM attendance_records WHERE attendance_date = ?',
      [today]
    );
    const markedSlotsToday = todayMarkedRow ? todayMarkedRow.marked_slots : 0;
    const expectedSlotsToday = totalActiveStudents * PERIODS_PER_DAY;
    const todayCompletionPercentage = expectedSlotsToday > 0
      ? Number(((markedSlotsToday / expectedSlotsToday) * 100).toFixed(1))
      : 0;

    // 3. Average Attendance Percentage (Across current month)
    const monthlyReport = await reportService.getMonthlyReport({ month: currentMonth });
    const averageAttendancePercentage = monthlyReport.average_attendance_percentage;
    const studentsBelowThreshold = monthlyReport.low_attendance_count;
    const threshold = monthlyReport.threshold;

    // 4. Recent Attendance Activity (Last 5 days of recorded attendance batches)
    const recentActivity = await all(`
      SELECT 
        ar.attendance_date,
        c.name as class_name,
        d.code as department_code,
        COUNT(DISTINCT ar.student_id) as students_marked,
        SUM(CASE WHEN ar.status = 'PRESENT' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN ar.status = 'ABSENT' THEN 1 ELSE 0 END) as absent_count,
        MAX(ar.updated_at) as last_updated
      FROM attendance_records ar
      JOIN classes c ON ar.class_id = c.id
      JOIN departments d ON c.department_id = d.id
      GROUP BY ar.attendance_date, ar.class_id
      ORDER BY ar.attendance_date DESC, last_updated DESC
      LIMIT 6
    `);

    // 5. Monthly Attendance Trends (Daily percentages for the last 10 active recording dates)
    const trends = await all(`
      SELECT 
        attendance_date,
        COUNT(*) as total_records,
        SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) as present_records
      FROM attendance_records
      GROUP BY attendance_date
      ORDER BY attendance_date DESC
      LIMIT 10
    `);

    // Format trends in chronological order
    const trendData = trends.reverse().map((t) => ({
      date: t.attendance_date,
      attendancePercentage: t.total_records > 0 
        ? Number(((t.present_records / t.total_records) * 100).toFixed(1))
        : 0,
      totalMarked: t.total_records
    }));

    // 6. Department breakdown
    const deptStats = await all(`
      SELECT 
        d.code as department_code,
        d.name as department_name,
        COUNT(s.id) as student_count
      FROM departments d
      LEFT JOIN students s ON s.department_id = d.id AND s.is_active = 1
      GROUP BY d.id
    `);

    return {
      today,
      current_month: currentMonth,
      metrics: {
        total_active_students: totalActiveStudents,
        today_completion_percentage: todayCompletionPercentage,
        today_marked_slots: markedSlotsToday,
        today_expected_slots: expectedSlotsToday,
        average_attendance_percentage: averageAttendancePercentage,
        students_below_threshold: studentsBelowThreshold,
        attendance_threshold: threshold
      },
      recent_activity: recentActivity,
      monthly_trends: trendData,
      departments: deptStats
    };
  }
}

module.exports = new DashboardService();
