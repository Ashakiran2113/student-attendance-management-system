const attendanceService = require('../services/attendanceService');

class AttendanceController {
  async getDailyAttendance(req, res, next) {
    try {
      const { class_id, date } = req.query;
      const attendance = await attendanceService.getDailyAttendance(class_id, date);
      res.json({ success: true, data: attendance });
    } catch (err) {
      next(err);
    }
  }

  async saveDailyAttendanceBulk(req, res, next) {
    try {
      const { class_id, attendance_date, records } = req.body;
      const updatedAttendance = await attendanceService.saveDailyAttendanceBulk(class_id, attendance_date, records);
      res.json({
        success: true,
        message: 'Attendance saved successfully',
        data: updatedAttendance
      });
    } catch (err) {
      next(err);
    }
  }

  async getAttendanceHistory(req, res, next) {
    try {
      const {
        start_date,
        end_date,
        class_id,
        department_id,
        student_id,
        period_number,
        status,
        limit,
        offset
      } = req.query;

      const history = await attendanceService.getAttendanceHistory({
        startDate: start_date,
        endDate: end_date,
        classId: class_id,
        departmentId: department_id,
        studentId: student_id,
        periodNumber: period_number,
        status,
        limit: limit || 100,
        offset: offset || 0
      });

      res.json({ success: true, ...history });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AttendanceController();
