const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

router.get('/daily', (req, res, next) => attendanceController.getDailyAttendance(req, res, next));
router.post('/bulk', (req, res, next) => attendanceController.saveDailyAttendanceBulk(req, res, next));
router.get('/history', (req, res, next) => attendanceController.getAttendanceHistory(req, res, next));

module.exports = router;
