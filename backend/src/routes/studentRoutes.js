const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

router.get('/', (req, res, next) => studentController.getAllStudents(req, res, next));
router.get('/:id', (req, res, next) => studentController.getStudentById(req, res, next));
router.post('/', (req, res, next) => studentController.createStudent(req, res, next));
router.put('/:id', (req, res, next) => studentController.updateStudent(req, res, next));
router.patch('/:id/status', (req, res, next) => studentController.setStudentStatus(req, res, next));
router.delete('/:id', (req, res, next) => studentController.deleteStudent(req, res, next));

module.exports = router;
