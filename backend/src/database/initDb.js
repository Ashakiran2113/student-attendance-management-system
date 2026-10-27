const fs = require('fs');
const path = require('path');
const { exec, run, get } = require('../config/database');
const { DEFAULT_ATTENDANCE_THRESHOLD, DEFAULT_PERIOD_TIMINGS } = require('../config/constants');

async function initDatabase() {
  console.log('Initializing database schema...');
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  // Execute DDL schema
  await exec(schemaSql);
  console.log('Database tables and indexes created successfully.');

  // Initialize default settings if not exists
  const defaultSettings = [
    { key: 'institution_name', value: 'National Institute of Science & Technology', description: 'Institution legal name' },
    { key: 'academic_year', value: '2024-2025', description: 'Current active academic year' },
    { key: 'attendance_threshold', value: String(DEFAULT_ATTENDANCE_THRESHOLD), description: 'Minimum attendance percentage required' },
    { key: 'working_days', value: JSON.stringify(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']), description: 'Days of week where attendance is marked' },
    { key: 'periods_per_day', value: '7', description: 'Standard periods count per working day' },
    { key: 'period_schedule', value: JSON.stringify(DEFAULT_PERIOD_TIMINGS), description: 'Daily period timetable and duration' }
  ];

  for (const s of defaultSettings) {
    const existing = await get('SELECT key FROM settings WHERE key = ?', [s.key]);
    if (!existing) {
      await run(
        'INSERT INTO settings (key, value, description) VALUES (?, ?, ?)',
        [s.key, s.value, s.description]
      );
    }
  }

  // Initialize default departments if not exists
  const defaultDepts = [
    { code: 'CSE', name: 'Computer Science and Engineering' },
    { code: 'ECE', name: 'Electronics and Communication Engineering' },
    { code: 'MECH', name: 'Mechanical Engineering' }
  ];

  for (const d of defaultDepts) {
    const existing = await get('SELECT id FROM departments WHERE code = ?', [d.code]);
    if (!existing) {
      await run('INSERT INTO departments (code, name) VALUES (?, ?)', [d.code, d.name]);
    }
  }

  // Initialize default classes if not exists
  const cseDept = await get('SELECT id FROM departments WHERE code = ?', ['CSE']);
  const eceDept = await get('SELECT id FROM departments WHERE code = ?', ['ECE']);
  const mechDept = await get('SELECT id FROM departments WHERE code = ?', ['MECH']);

  const defaultClasses = [
    { department_id: cseDept.id, name: 'CS-A', academic_year: '2024-2025' },
    { department_id: cseDept.id, name: 'CS-B', academic_year: '2024-2025' },
    { department_id: eceDept.id, name: 'EC-A', academic_year: '2024-2025' },
    { department_id: mechDept.id, name: 'ME-A', academic_year: '2024-2025' }
  ];

  for (const c of defaultClasses) {
    const existing = await get(
      'SELECT id FROM classes WHERE department_id = ? AND name = ? AND academic_year = ?',
      [c.department_id, c.name, c.academic_year]
    );
    if (!existing) {
      await run(
        'INSERT INTO classes (department_id, name, academic_year) VALUES (?, ?, ?)',
        [c.department_id, c.name, c.academic_year]
      );
    }
  }

  console.log('Default settings, departments, and classes verified.');
}

if (require.main === module) {
  initDatabase()
    .then(() => {
      console.log('Database initialization completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Database initialization failed:', err);
      process.exit(1);
    });
}

module.exports = { initDatabase };
