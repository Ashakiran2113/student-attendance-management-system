const settingsService = require('../services/settingsService');

class SettingsController {
  async getSettings(req, res, next) {
    try {
      const settings = await settingsService.getAllSettings();
      res.json({ success: true, data: settings });
    } catch (err) {
      next(err);
    }
  }

  async updateSettings(req, res, next) {
    try {
      const updated = await settingsService.updateSettings(req.body);
      res.json({ success: true, message: 'Settings updated successfully', data: updated });
    } catch (err) {
      next(err);
    }
  }

  async getDepartments(req, res, next) {
    try {
      const departments = await settingsService.getDepartments();
      res.json({ success: true, data: departments });
    } catch (err) {
      next(err);
    }
  }

  async createDepartment(req, res, next) {
    try {
      const department = await settingsService.createDepartment(req.body);
      res.status(201).json({ success: true, message: 'Department created', data: department });
    } catch (err) {
      next(err);
    }
  }

  async getClasses(req, res, next) {
    try {
      const { department_id } = req.query;
      const classes = await settingsService.getClasses(department_id);
      res.json({ success: true, data: classes });
    } catch (err) {
      next(err);
    }
  }

  async createClass(req, res, next) {
    try {
      const newClass = await settingsService.createClass(req.body);
      res.status(201).json({ success: true, message: 'Class created', data: newClass });
    } catch (err) {
      next(err);
    }
  }

  async getHolidays(req, res, next) {
    try {
      const holidays = await settingsService.getHolidays();
      res.json({ success: true, data: holidays });
    } catch (err) {
      next(err);
    }
  }

  async createHoliday(req, res, next) {
    try {
      const holiday = await settingsService.createHoliday(req.body);
      res.status(201).json({ success: true, message: 'Holiday created', data: holiday });
    } catch (err) {
      next(err);
    }
  }

  async deleteHoliday(req, res, next) {
    try {
      const result = await settingsService.deleteHoliday(req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new SettingsController();
