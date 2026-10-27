const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

router.get('/', (req, res, next) => settingsController.getSettings(req, res, next));
router.put('/', (req, res, next) => settingsController.updateSettings(req, res, next));

router.get('/departments', (req, res, next) => settingsController.getDepartments(req, res, next));
router.post('/departments', (req, res, next) => settingsController.createDepartment(req, res, next));

router.get('/classes', (req, res, next) => settingsController.getClasses(req, res, next));
router.post('/classes', (req, res, next) => settingsController.createClass(req, res, next));

router.get('/holidays', (req, res, next) => settingsController.getHolidays(req, res, next));
router.post('/holidays', (req, res, next) => settingsController.createHoliday(req, res, next));
router.delete('/holidays/:id', (req, res, next) => settingsController.deleteHoliday(req, res, next));

module.exports = router;
