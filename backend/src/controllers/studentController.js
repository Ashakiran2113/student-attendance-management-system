const studentService = require('../services/studentService');

class StudentController {
  async getAllStudents(req, res, next) {
    try {
      const { search, department_id, class_id, is_active, sort_by, sort_order } = req.query;
      const students = await studentService.getAllStudents({
        search,
        department_id,
        class_id,
        is_active,
        sort_by,
        sort_order
      });
      res.json({ success: true, count: students.length, data: students });
    } catch (err) {
      next(err);
    }
  }

  async getStudentById(req, res, next) {
    try {
      const student = await studentService.getStudentById(req.params.id);
      res.json({ success: true, data: student });
    } catch (err) {
      next(err);
    }
  }

  async createStudent(req, res, next) {
    try {
      const student = await studentService.createStudent(req.body);
      res.status(201).json({ success: true, message: 'Student created successfully', data: student });
    } catch (err) {
      next(err);
    }
  }

  async updateStudent(req, res, next) {
    try {
      const student = await studentService.updateStudent(req.params.id, req.body);
      res.json({ success: true, message: 'Student updated successfully', data: student });
    } catch (err) {
      next(err);
    }
  }

  async setStudentStatus(req, res, next) {
    try {
      const { is_active } = req.body;
      if (is_active === undefined) {
        return res.status(400).json({ success: false, message: 'is_active (0 or 1) is required' });
      }
      const student = await studentService.setStudentStatus(req.params.id, is_active);
      res.json({ success: true, message: `Student ${is_active ? 'activated' : 'deactivated'} successfully`, data: student });
    } catch (err) {
      next(err);
    }
  }

  async deleteStudent(req, res, next) {
    try {
      const result = await studentService.deleteStudent(req.params.id);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new StudentController();
