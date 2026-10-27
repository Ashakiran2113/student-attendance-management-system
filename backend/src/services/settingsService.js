const { all, get, run, withTransaction } = require('../config/database');

class SettingsService {
  async getAllSettings() {
    const rows = await all('SELECT key, value, description, updated_at FROM settings');
    const settings = {};
    for (const r of rows) {
      try {
        settings[r.key] = JSON.parse(r.value);
      } catch (e) {
        settings[r.key] = r.value;
      }
    }
    return settings;
  }

  async updateSettings(settingsMap) {
    await withTransaction(async ({ run }) => {
      for (const [key, val] of Object.entries(settingsMap)) {
        const strVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
        await run(
          `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
          [key, strVal]
        );
      }
    });
    return await this.getAllSettings();
  }

  async getDepartments() {
    return await all('SELECT * FROM departments ORDER BY code ASC');
  }

  async createDepartment({ code, name }) {
    if (!code || !name) {
      const error = new Error('Department code and name are required');
      error.statusCode = 400;
      throw error;
    }
    const existing = await get('SELECT id FROM departments WHERE code = ?', [code.trim().toUpperCase()]);
    if (existing) {
      const error = new Error(`Department code ${code} already exists`);
      error.statusCode = 409;
      throw error;
    }
    const result = await run(
      'INSERT INTO departments (code, name) VALUES (?, ?)',
      [code.trim().toUpperCase(), name.trim()]
    );
    return await get('SELECT * FROM departments WHERE id = ?', [result.lastID]);
  }

  async getClasses(departmentId) {
    let sql = `
      SELECT c.*, d.name as department_name, d.code as department_code,
             (SELECT COUNT(*) FROM students s WHERE s.class_id = c.id AND s.is_active = 1) as student_count
      FROM classes c
      JOIN departments d ON c.department_id = d.id
    `;
    const params = [];
    if (departmentId) {
      sql += ' WHERE c.department_id = ?';
      params.push(departmentId);
    }
    sql += ' ORDER BY d.code ASC, c.name ASC';
    return await all(sql, params);
  }

  async createClass({ department_id, name, academic_year }) {
    if (!department_id || !name || !academic_year) {
      const error = new Error('department_id, name, and academic_year are required');
      error.statusCode = 400;
      throw error;
    }
    const result = await run(
      'INSERT INTO classes (department_id, name, academic_year) VALUES (?, ?, ?)',
      [department_id, name.trim(), academic_year.trim()]
    );
    return await get('SELECT * FROM classes WHERE id = ?', [result.lastID]);
  }

  async getHolidays() {
    return await all('SELECT * FROM holidays ORDER BY holiday_date ASC');
  }

  async createHoliday({ holiday_date, name, description }) {
    if (!holiday_date || !name) {
      const error = new Error('holiday_date and name are required');
      error.statusCode = 400;
      throw error;
    }
    const result = await run(
      'INSERT INTO holidays (holiday_date, name, description) VALUES (?, ?, ?)',
      [holiday_date, name.trim(), description?.trim() || null]
    );
    return await get('SELECT * FROM holidays WHERE id = ?', [result.lastID]);
  }

  async deleteHoliday(id) {
    await run('DELETE FROM holidays WHERE id = ?', [id]);
    return { success: true, message: 'Holiday deleted' };
  }
}

module.exports = new SettingsService();
