const reportService = require('../services/reportService');

class ReportController {
  async getMonthlyReport(req, res, next) {
    try {
      const { class_id, month, threshold } = req.query;
      const report = await reportService.getMonthlyReport({
        classId: class_id,
        month,
        threshold
      });
      res.json({ success: true, data: report });
    } catch (err) {
      next(err);
    }
  }

  async getStudentReport(req, res, next) {
    try {
      const { id } = req.params;
      const { month } = req.query;
      const report = await reportService.getStudentReport(id, month);
      res.json({ success: true, data: report });
    } catch (err) {
      next(err);
    }
  }

  async getLowAttendanceReport(req, res, next) {
    try {
      const { class_id, month, threshold } = req.query;
      const report = await reportService.getLowAttendanceStudents({
        classId: class_id,
        month,
        threshold
      });
      res.json({ success: true, data: report });
    } catch (err) {
      next(err);
    }
  }

  async exportCsv(req, res, next) {
    try {
      const { class_id, month, threshold } = req.query;
      const csv = await reportService.generateCsvExport({
        classId: class_id,
        month,
        threshold
      });

      const fileName = `attendance_report_${month || 'current'}${class_id ? `_class_${class_id}` : ''}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.status(200).send(csv);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ReportController();
