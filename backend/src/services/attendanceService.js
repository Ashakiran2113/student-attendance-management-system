const { run, get, all, withTransaction } = require('../config/database');
const { PERIODS_PER_DAY, STATUS } = require('../config/constants');

class AttendanceService {
  /**
   * Retrieves the daily attendance grid for a specific class and date.
   * Returns all active students in the class, along with period 1-7 records.
   * Missing records have status: null (unmarked), clearly distinguished from PRESENT or ABSENT.
   */
  async getDailyAttendance(classId, attendanceDate) {
    if (!classId || !attendanceDate) {
      const error = new Error('class_id and attendance_date (YYYY-MM-DD) are required');
      error.statusCode = 400;
      throw error;
    }

    // Get active students in this class
    const students = await all(
      `SELECT id, roll_number, full_name, email, is_active
       FROM students
       WHERE class_id = ? AND is_active = 1
       ORDER BY roll_number ASC`,
      [classId]
    );

    // Get all existing attendance records for this class on this date
    const records = await all(
      `SELECT id, student_id, period_number, status, remarks, recorded_at, updated_at
       FROM attendance_records
       WHERE class_id = ? AND attendance_date = ?`,
      [classId, attendanceDate]
    );

    // Map existing records by student_id and period_number
    const recordMap = new Map();
    for (const r of records) {
      recordMap.set(`${r.student_id}_${r.period_number}`, r);
    }

    let totalPossiblePeriods = students.length * PERIODS_PER_DAY;
    let totalMarkedPeriods = 0;
    let totalPresentCount = 0;
    let totalAbsentCount = 0;

    const studentRows = students.map((student) => {
      const periods = [];
      let presentCount = 0;
      let absentCount = 0;

      for (let p = 1; p <= PERIODS_PER_DAY; p++) {
        const record = recordMap.get(`${student.id}_${p}`);
        if (record) {
          totalMarkedPeriods++;
          if (record.status === STATUS.PRESENT) {
            presentCount++;
            totalPresentCount++;
          } else if (record.status === STATUS.ABSENT) {
            absentCount++;
            totalAbsentCount++;
          }
          periods.push({
            period_number: p,
            status: record.status,
            remarks: record.remarks || '',
            is_saved: true,
            updated_at: record.updated_at
          });
        } else {
          // Unmarked / missing record
          periods.push({
            period_number: p,
            status: null, // Clearly null, not default PRESENT or ABSENT
            remarks: '',
            is_saved: false,
            updated_at: null
          });
        }
      }

      return {
        student_id: student.id,
        roll_number: student.roll_number,
        full_name: student.full_name,
        email: student.email,
        periods,
        present_count: presentCount,
        absent_count: absentCount,
        marked_periods: presentCount + absentCount,
        is_complete: (presentCount + absentCount) === PERIODS_PER_DAY
      };
    });

    const completionPercentage = totalPossiblePeriods > 0 
      ? Number(((totalMarkedPeriods / totalPossiblePeriods) * 100).toFixed(1))
      : 0;

    return {
      class_id: Number(classId),
      attendance_date: attendanceDate,
      total_students: students.length,
      periods_per_day: PERIODS_PER_DAY,
      total_possible_slots: totalPossiblePeriods,
      total_marked_slots: totalMarkedPeriods,
      total_present_slots: totalPresentCount,
      total_absent_slots: totalAbsentCount,
      completion_percentage: completionPercentage,
      is_day_fully_marked: totalPossiblePeriods > 0 && totalMarkedPeriods === totalPossiblePeriods,
      students: studentRows
    };
  }

  /**
   * Bulk saves/updates attendance records for a class on a specific date.
   * Uses SQLite transaction and UPSERT with validation.
   */
  async saveDailyAttendanceBulk(classId, attendanceDate, items) {
    if (!classId || !attendanceDate) {
      const error = new Error('class_id and attendance_date are required');
      error.statusCode = 400;
      throw error;
    }

    if (!Array.isArray(items) || items.length === 0) {
      const error = new Error('Records items array must be non-empty');
      error.statusCode = 400;
      throw error;
    }

    // Validate every record item
    for (const item of items) {
      if (!item.student_id) {
        const error = new Error('Each record must contain student_id');
        error.statusCode = 400;
        throw error;
      }
      const p = Number(item.period_number);
      if (isNaN(p) || p < 1 || p > PERIODS_PER_DAY) {
        const error = new Error(`Invalid period_number ${item.period_number}. Must be between 1 and ${PERIODS_PER_DAY}`);
        error.statusCode = 400;
        throw error;
      }
      if (![STATUS.PRESENT, STATUS.ABSENT].includes(item.status)) {
        const error = new Error(`Invalid status '${item.status}'. Only '${STATUS.PRESENT}' and '${STATUS.ABSENT}' are allowed.`);
        error.statusCode = 400;
        throw error;
      }
    }

    // Execute atomic bulk upsert inside transaction
    const upsertSql = `
      INSERT INTO attendance_records (student_id, class_id, attendance_date, period_number, status, remarks, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(student_id, attendance_date, period_number)
      DO UPDATE SET
        status = excluded.status,
        remarks = excluded.remarks,
        updated_at = CURRENT_TIMESTAMP
    `;

    await withTransaction(async ({ run }) => {
      for (const item of items) {
        await run(upsertSql, [
          item.student_id,
          classId,
          attendanceDate,
          item.period_number,
          item.status,
          item.remarks || null
        ]);
      }
    });

    // Return the updated daily state
    return await this.getDailyAttendance(classId, attendanceDate);
  }

  /**
   * Queries historical attendance records with comprehensive filtering.
   */
  async getAttendanceHistory({ startDate, endDate, classId, departmentId, studentId, periodNumber, status, limit = 100, offset = 0 } = {}) {
    let sql = `
      SELECT 
        ar.id,
        ar.attendance_date,
        ar.period_number,
        ar.status,
        ar.remarks,
        ar.updated_at,
        s.id as student_id,
        s.roll_number,
        s.full_name as student_name,
        c.id as class_id,
        c.name as class_name,
        d.id as department_id,
        d.name as department_name,
        d.code as department_code
      FROM attendance_records ar
      JOIN students s ON ar.student_id = s.id
      JOIN classes c ON ar.class_id = c.id
      JOIN departments d ON s.department_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      sql += ` AND ar.attendance_date >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      sql += ` AND ar.attendance_date <= ?`;
      params.push(endDate);
    }
    if (classId) {
      sql += ` AND ar.class_id = ?`;
      params.push(classId);
    }
    if (departmentId) {
      sql += ` AND s.department_id = ?`;
      params.push(departmentId);
    }
    if (studentId) {
      sql += ` AND ar.student_id = ?`;
      params.push(studentId);
    }
    if (periodNumber) {
      sql += ` AND ar.period_number = ?`;
      params.push(Number(periodNumber));
    }
    if (status) {
      sql += ` AND ar.status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY ar.attendance_date DESC, ar.period_number ASC, s.roll_number ASC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const records = await all(sql, params);

    // Count total matches
    let countSql = `
      SELECT COUNT(*) as total
      FROM attendance_records ar
      JOIN students s ON ar.student_id = s.id
      WHERE 1=1
    `;
    const countParams = [];
    if (startDate) { countSql += ` AND ar.attendance_date >= ?`; countParams.push(startDate); }
    if (endDate) { countSql += ` AND ar.attendance_date <= ?`; countParams.push(endDate); }
    if (classId) { countSql += ` AND ar.class_id = ?`; countParams.push(classId); }
    if (departmentId) { countSql += ` AND s.department_id = ?`; countParams.push(departmentId); }
    if (studentId) { countSql += ` AND ar.student_id = ?`; countParams.push(studentId); }
    if (periodNumber) { countSql += ` AND ar.period_number = ?`; countParams.push(Number(periodNumber)); }
    if (status) { countSql += ` AND ar.status = ?`; countParams.push(status); }

    const totalCount = await get(countSql, countParams);

    return {
      total: totalCount ? totalCount.total : 0,
      limit: Number(limit),
      offset: Number(offset),
      records
    };
  }
}

module.exports = new AttendanceService();
