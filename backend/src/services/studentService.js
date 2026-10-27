const { run, get, all } = require('../config/database');

class StudentService {
  async getAllStudents({ search, department_id, class_id, is_active, sort_by = 'roll_number', sort_order = 'ASC' } = {}) {
    let sql = `
      SELECT 
        s.id,
        s.roll_number,
        s.full_name,
        s.department_id,
        s.class_id,
        s.academic_year,
        s.email,
        s.phone,
        s.is_active,
        s.created_at,
        d.name as department_name,
        d.code as department_code,
        c.name as class_name
      FROM students s
      JOIN departments d ON s.department_id = d.id
      JOIN classes c ON s.class_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      sql += ` AND (s.roll_number LIKE ? OR s.full_name LIKE ? OR s.email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (department_id) {
      sql += ` AND s.department_id = ?`;
      params.push(department_id);
    }

    if (class_id) {
      sql += ` AND s.class_id = ?`;
      params.push(class_id);
    }

    if (is_active !== undefined && is_active !== null && is_active !== '') {
      sql += ` AND s.is_active = ?`;
      params.push(Number(is_active));
    }

    const allowedSortFields = ['roll_number', 'full_name', 'class_name', 'department_code', 'is_active', 'created_at'];
    const safeSortBy = allowedSortFields.includes(sort_by) ? sort_by : 'roll_number';
    const safeSortOrder = sort_order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    sql += ` ORDER BY ${safeSortBy} ${safeSortOrder}`;

    return await all(sql, params);
  }

  async getStudentById(id) {
    const sql = `
      SELECT 
        s.*,
        d.name as department_name,
        d.code as department_code,
        c.name as class_name
      FROM students s
      JOIN departments d ON s.department_id = d.id
      JOIN classes c ON s.class_id = c.id
      WHERE s.id = ?
    `;
    const student = await get(sql, [id]);
    if (!student) {
      const error = new Error('Student not found');
      error.statusCode = 404;
      throw error;
    }
    return student;
  }

  async createStudent({ roll_number, full_name, department_id, class_id, academic_year, email, phone }) {
    if (!roll_number || !full_name || !department_id || !class_id || !academic_year) {
      const error = new Error('Missing required student fields (roll_number, full_name, department_id, class_id, academic_year)');
      error.statusCode = 400;
      throw error;
    }

    // Validate uniqueness of roll_number within the class
    const existing = await get(
      'SELECT id FROM students WHERE class_id = ? AND roll_number = ?',
      [class_id, roll_number.trim()]
    );
    if (existing) {
      const error = new Error(`Roll number '${roll_number}' already exists in this class`);
      error.statusCode = 409;
      throw error;
    }

    const result = await run(
      `INSERT INTO students (roll_number, full_name, department_id, class_id, academic_year, email, phone, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [roll_number.trim(), full_name.trim(), department_id, class_id, academic_year.trim(), email?.trim() || null, phone?.trim() || null]
    );

    return await this.getStudentById(result.lastID);
  }

  async updateStudent(id, { roll_number, full_name, department_id, class_id, academic_year, email, phone, is_active }) {
    const existingStudent = await this.getStudentById(id);

    const targetClassId = class_id || existingStudent.class_id;
    const targetRollNumber = roll_number ? roll_number.trim() : existingStudent.roll_number;

    // Check roll number uniqueness if changed
    if (roll_number && (targetRollNumber !== existingStudent.roll_number || targetClassId !== existingStudent.class_id)) {
      const duplicate = await get(
        'SELECT id FROM students WHERE class_id = ? AND roll_number = ? AND id != ?',
        [targetClassId, targetRollNumber, id]
      );
      if (duplicate) {
        const error = new Error(`Roll number '${targetRollNumber}' already exists in the selected class`);
        error.statusCode = 409;
        throw error;
      }
    }

    const updatedActive = is_active !== undefined ? Number(is_active) : existingStudent.is_active;

    await run(
      `UPDATE students
       SET roll_number = ?, full_name = ?, department_id = ?, class_id = ?, academic_year = ?, email = ?, phone = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        targetRollNumber,
        full_name ? full_name.trim() : existingStudent.full_name,
        department_id || existingStudent.department_id,
        targetClassId,
        academic_year ? academic_year.trim() : existingStudent.academic_year,
        email !== undefined ? email?.trim() : existingStudent.email,
        phone !== undefined ? phone?.trim() : existingStudent.phone,
        updatedActive,
        id
      ]
    );

    return await this.getStudentById(id);
  }

  async setStudentStatus(id, is_active) {
    await this.getStudentById(id);
    await run(
      'UPDATE students SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [Number(is_active), id]
    );
    return await this.getStudentById(id);
  }

  async deleteStudent(id) {
    await this.getStudentById(id);
    // Preserving historical integrity: Soft delete or check if records exist
    const attendanceCount = await get('SELECT COUNT(*) as count FROM attendance_records WHERE student_id = ?', [id]);
    if (attendanceCount && attendanceCount.count > 0) {
      // Deactivate instead of hard deleting to preserve historical attendance records
      await run('UPDATE students SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
      return { message: 'Student has historical attendance records and was deactivated rather than permanently deleted to preserve data integrity', deactivated: true };
    }

    await run('DELETE FROM students WHERE id = ?', [id]);
    return { message: 'Student deleted successfully', deleted: true };
  }
}

module.exports = new StudentService();
