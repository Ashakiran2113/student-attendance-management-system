const { all, get } = require('../config/database');
const { DEFAULT_ATTENDANCE_THRESHOLD, STATUS } = require('../config/constants');

class ReportService {
  /**
   * Helper to fetch the configured attendance threshold.
   */
  async getThreshold() {
    const setting = await get("SELECT value FROM settings WHERE key = 'attendance_threshold'");
    return setting ? parseFloat(setting.value) : DEFAULT_ATTENDANCE_THRESHOLD;
  }

  /**
   * Computes monthly report for a specific class or across classes.
   * Month format: 'YYYY-MM'
   */
  async getMonthlyReport({ classId, month, threshold }) {
    if (!month) {
      const now = new Date();
      month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    const minThreshold = threshold !== undefined ? parseFloat(threshold) : await this.getThreshold();

    // Query active students in the target class (or all classes if none provided)
    let studentSql = `
      SELECT 
        s.id as student_id,
        s.roll_number,
        s.full_name,
        s.email,
        s.phone,
        s.is_active,
        c.id as class_id,
        c.name as class_name,
        d.id as department_id,
        d.name as department_name,
        d.code as department_code
      FROM students s
      JOIN classes c ON s.class_id = c.id
      JOIN departments d ON s.department_id = d.id
      WHERE s.is_active = 1
    `;
    const studentParams = [];
    if (classId) {
      studentSql += ` AND s.class_id = ?`;
      studentParams.push(classId);
    }
    studentSql += ` ORDER BY s.roll_number ASC`;

    const students = await all(studentSql, studentParams);

    // Compute actual scheduled working periods for this class in this month:
    // Defined as distinct (attendance_date, period_number) where attendance was conducted for this class.
    let workingPeriodsSql = `
      SELECT COUNT(DISTINCT attendance_date || '_' || period_number) as working_periods
      FROM attendance_records
      WHERE substr(attendance_date, 1, 7) = ?
    `;
    const wpParams = [month];
    if (classId) {
      workingPeriodsSql += ` AND class_id = ?`;
      wpParams.push(classId);
    }
    const wpRow = await get(workingPeriodsSql, wpParams);
    const scheduledWorkingPeriods = wpRow ? (wpRow.working_periods || 0) : 0;

    // Get attendance aggregates for each student in this month
    let attendanceSql = `
      SELECT 
        student_id,
        SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) as attended_periods,
        SUM(CASE WHEN status = 'ABSENT' THEN 1 ELSE 0 END) as absent_periods
      FROM attendance_records
      WHERE substr(attendance_date, 1, 7) = ?
    `;
    const attParams = [month];
    if (classId) {
      attendanceSql += ` AND class_id = ?`;
      attParams.push(classId);
    }
    attendanceSql += ` GROUP BY student_id`;

    const attendanceStats = await all(attendanceSql, attParams);
    const statsMap = new Map();
    for (const stat of attendanceStats) {
      statsMap.set(stat.student_id, stat);
    }

    let classTotalAttended = 0;
    let classTotalWorkingPossible = 0;
    let shortageCount = 0;

    const studentReports = students.map((student) => {
      const stats = statsMap.get(student.id) || { attended_periods: 0, absent_periods: 0 };
      const attended = Number(stats.attended_periods) || 0;
      const absent = Number(stats.absent_periods) || 0;
      
      // Effective working periods for this student (either class scheduled periods or sum of attended + absent)
      const studentWorkingPeriods = scheduledWorkingPeriods > 0 
        ? scheduledWorkingPeriods 
        : (attended + absent);

      // Safe division: Formula = (Periods Attended / Working Periods) * 100
      let percentage = 0.0;
      if (studentWorkingPeriods > 0) {
        percentage = Number(((attended / studentWorkingPeriods) * 100).toFixed(2));
      }

      const isShortage = studentWorkingPeriods > 0 && percentage < minThreshold;
      if (isShortage) shortageCount++;

      classTotalAttended += attended;
      classTotalWorkingPossible += studentWorkingPeriods;

      return {
        student_id: student.student_id,
        roll_number: student.roll_number,
        full_name: student.full_name,
        email: student.email,
        phone: student.phone,
        class_id: student.class_id,
        class_name: student.class_name,
        department_code: student.department_code,
        department_name: student.department_name,
        working_periods: studentWorkingPeriods,
        periods_attended: attended,
        periods_absent: absent,
        attendance_percentage: percentage,
        status: isShortage ? 'SHORTAGE' : 'NORMAL',
        threshold: minThreshold
      };
    });

    const averagePercentage = classTotalWorkingPossible > 0
      ? Number(((classTotalAttended / classTotalWorkingPossible) * 100).toFixed(2))
      : 0.0;

    return {
      month,
      class_id: classId ? Number(classId) : null,
      threshold: minThreshold,
      total_students: students.length,
      scheduled_working_periods: scheduledWorkingPeriods,
      average_attendance_percentage: averagePercentage,
      low_attendance_count: shortageCount,
      students: studentReports
    };
  }

  /**
   * Detailed breakdown for a single student across a given month or academic period.
   */
  async getStudentReport(studentId, month) {
    if (!studentId) {
      const error = new Error('student_id is required');
      error.statusCode = 400;
      throw error;
    }

    if (!month) {
      const now = new Date();
      month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    const threshold = await this.getThreshold();

    const student = await get(
      `SELECT s.*, c.name as class_name, d.name as department_name, d.code as department_code
       FROM students s
       JOIN classes c ON s.class_id = c.id
       JOIN departments d ON s.department_id = d.id
       WHERE s.id = ?`,
      [studentId]
    );

    if (!student) {
      const error = new Error('Student not found');
      error.statusCode = 404;
      throw error;
    }

    // Daily breakdown for this student
    const records = await all(
      `SELECT attendance_date, period_number, status, remarks, updated_at
       FROM attendance_records
       WHERE student_id = ? AND substr(attendance_date, 1, 7) = ?
       ORDER BY attendance_date ASC, period_number ASC`,
      [studentId, month]
    );

    // Group by date
    const dailyMap = {};
    let attended = 0;
    let absent = 0;

    for (const r of records) {
      if (!dailyMap[r.attendance_date]) {
        dailyMap[r.attendance_date] = { date: r.attendance_date, periods: {}, present: 0, absent: 0 };
      }
      dailyMap[r.attendance_date].periods[r.period_number] = r.status;
      if (r.status === STATUS.PRESENT) {
        attended++;
        dailyMap[r.attendance_date].present++;
      } else if (r.status === STATUS.ABSENT) {
        absent++;
        dailyMap[r.attendance_date].absent++;
      }
    }

    // Get class scheduled working periods
    const wpRow = await get(
      `SELECT COUNT(DISTINCT attendance_date || '_' || period_number) as working_periods
       FROM attendance_records
       WHERE class_id = ? AND substr(attendance_date, 1, 7) = ?`,
      [student.class_id, month]
    );
    const scheduledWorkingPeriods = wpRow ? (wpRow.working_periods || 0) : (attended + absent);

    let percentage = 0.0;
    if (scheduledWorkingPeriods > 0) {
      percentage = Number(((attended / scheduledWorkingPeriods) * 100).toFixed(2));
    }

    return {
      student,
      month,
      threshold,
      scheduled_working_periods: scheduledWorkingPeriods,
      periods_attended: attended,
      periods_absent: absent,
      attendance_percentage: percentage,
      status: (scheduledWorkingPeriods > 0 && percentage < threshold) ? 'SHORTAGE' : 'NORMAL',
      daily_breakdown: Object.values(dailyMap)
    };
  }

  /**
   * Low attendance identification report filtered by threshold.
   */
  async getLowAttendanceStudents({ classId, month, threshold }) {
    const report = await this.getMonthlyReport({ classId, month, threshold });
    const lowAttendanceList = report.students.filter(s => s.status === 'SHORTAGE');

    return {
      month: report.month,
      class_id: report.class_id,
      threshold: report.threshold,
      total_shortage_students: lowAttendanceList.length,
      students: lowAttendanceList
    };
  }

  /**
   * Generates CSV string for monthly report.
   */
  async generateCsvExport({ classId, month, threshold }) {
    const report = await this.getMonthlyReport({ classId, month, threshold });

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const headers = [
      'Roll Number',
      'Student Name',
      'Department',
      'Class',
      'Working Periods',
      'Periods Attended',
      'Periods Absent',
      'Attendance Percentage',
      'Status',
      'Month'
    ];

    const rows = [headers.join(',')];

    for (const s of report.students) {
      rows.push([
        escapeCsv(s.roll_number),
        escapeCsv(s.full_name),
        escapeCsv(s.department_code),
        escapeCsv(s.class_name),
        s.working_periods,
        s.periods_attended,
        s.periods_absent,
        `${s.attendance_percentage}%`,
        escapeCsv(s.status),
        escapeCsv(report.month)
      ].join(','));
    }

    return rows.join('\r\n');
  }
}

module.exports = new ReportService();
