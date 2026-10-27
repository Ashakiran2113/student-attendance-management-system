const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/monthly', (req, res, next) => reportController.getMonthlyReport(req, res, next));
router.get('/student/:id', (req, res, next) => reportController.getStudentReport(req, res, next));
router.get('/low-attendance', (req, res, next) => reportController.getLowAttendanceReport(req, res, next));
router.get('/export/csv', (req, res, next) => reportController.exportCsv(req, res, next));

module.exports = router;
