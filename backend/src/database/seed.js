const { run, get, all, withTransaction } = require('../config/database');
const { initDatabase } = require('./initDb');

async function seed() {
  await initDatabase();
  console.log('Seeding initial data...');

  const cseDept = await get('SELECT id FROM departments WHERE code = ?', ['CSE']);
  const eceDept = await get('SELECT id FROM departments WHERE code = ?', ['ECE']);
  const mechDept = await get('SELECT id FROM departments WHERE code = ?', ['MECH']);

  const csA = await get('SELECT id FROM classes WHERE name = ?', ['CS-A']);
  const csB = await get('SELECT id FROM classes WHERE name = ?', ['CS-B']);
  const ecA = await get('SELECT id FROM classes WHERE name = ?', ['EC-A']);
  const meA = await get('SELECT id FROM classes WHERE name = ?', ['ME-A']);

  const sampleStudents = [
    // CS-A
    { roll_number: 'CS-001', full_name: 'Aarav Sharma', department_id: cseDept.id, class_id: csA.id, academic_year: '2024-2025', email: 'aarav.sharma@campus.edu', phone: '9876543201', is_active: 1 },
    { roll_number: 'CS-002', full_name: 'Ananya Patel', department_id: cseDept.id, class_id: csA.id, academic_year: '2024-2025', email: 'ananya.patel@campus.edu', phone: '9876543202', is_active: 1 },
    { roll_number: 'CS-003', full_name: 'Rohan Verma', department_id: cseDept.id, class_id: csA.id, academic_year: '2024-2025', email: 'rohan.verma@campus.edu', phone: '9876543203', is_active: 1 },
    { roll_number: 'CS-004', full_name: 'Priya Nair', department_id: cseDept.id, class_id: csA.id, academic_year: '2024-2025', email: 'priya.nair@campus.edu', phone: '9876543204', is_active: 1 },
    { roll_number: 'CS-005', full_name: 'Vikram Malhotra', department_id: cseDept.id, class_id: csA.id, academic_year: '2024-2025', email: 'vikram.m@campus.edu', phone: '9876543205', is_active: 1 },
    { roll_number: 'CS-006', full_name: 'Sneha Rao', department_id: cseDept.id, class_id: csA.id, academic_year: '2024-2025', email: 'sneha.rao@campus.edu', phone: '9876543206', is_active: 1 },
    { roll_number: 'CS-007', full_name: 'Aditya Joshi', department_id: cseDept.id, class_id: csA.id, academic_year: '2024-2025', email: 'aditya.joshi@campus.edu', phone: '9876543207', is_active: 1 },
    { roll_number: 'CS-008', full_name: 'Meera Iyer', department_id: cseDept.id, class_id: csA.id, academic_year: '2024-2025', email: 'meera.iyer@campus.edu', phone: '9876543208', is_active: 1 },

    // CS-B
    { roll_number: 'CS-101', full_name: 'Karthik Reddy', department_id: cseDept.id, class_id: csB.id, academic_year: '2024-2025', email: 'karthik.r@campus.edu', phone: '9876543209', is_active: 1 },
    { roll_number: 'CS-102', full_name: 'Divya Sen', department_id: cseDept.id, class_id: csB.id, academic_year: '2024-2025', email: 'divya.sen@campus.edu', phone: '9876543210', is_active: 1 },
    { roll_number: 'CS-103', full_name: 'Varun Kapoor', department_id: cseDept.id, class_id: csB.id, academic_year: '2024-2025', email: 'varun.k@campus.edu', phone: '9876543211', is_active: 1 },
    { roll_number: 'CS-104', full_name: 'Tanvi Deshmukh', department_id: cseDept.id, class_id: csB.id, academic_year: '2024-2025', email: 'tanvi.d@campus.edu', phone: '9876543212', is_active: 1 },

    // EC-A
    { roll_number: 'EC-001', full_name: 'Rahul Krishnan', department_id: eceDept.id, class_id: ecA.id, academic_year: '2024-2025', email: 'rahul.k@campus.edu', phone: '9876543213', is_active: 1 },
    { roll_number: 'EC-002', full_name: 'Pooja Hegde', department_id: eceDept.id, class_id: ecA.id, academic_year: '2024-2025', email: 'pooja.h@campus.edu', phone: '9876543214', is_active: 1 },
    { roll_number: 'EC-003', full_name: 'Sanjay Sundaram', department_id: eceDept.id, class_id: ecA.id, academic_year: '2024-2025', email: 'sanjay.s@campus.edu', phone: '9876543215', is_active: 1 },

    // ME-A
    { roll_number: 'ME-001', full_name: 'Arjun Das', department_id: mechDept.id, class_id: meA.id, academic_year: '2024-2025', email: 'arjun.das@campus.edu', phone: '9876543216', is_active: 1 }
  ];

  for (const s of sampleStudents) {
    const existing = await get('SELECT id FROM students WHERE class_id = ? AND roll_number = ?', [s.class_id, s.roll_number]);
    if (!existing) {
      await run(
        `INSERT INTO students (roll_number, full_name, department_id, class_id, academic_year, email, phone, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [s.roll_number, s.full_name, s.department_id, s.class_id, s.academic_year, s.email, s.phone, s.is_active]
      );
    }
  }
  console.log(`Verified ${sampleStudents.length} sample students.`);

  // Sample holidays
  const holidays = [
    { holiday_date: '2024-10-02', name: 'Gandhi Jayanti', description: 'National Holiday' },
    { holiday_date: '2024-10-12', name: 'Dussehra', description: 'Festive Holiday' },
    { holiday_date: '2024-10-31', name: 'Diwali', description: 'Festival of Lights' }
  ];
  for (const h of holidays) {
    const existing = await get('SELECT id FROM holidays WHERE holiday_date = ?', [h.holiday_date]);
    if (!existing) {
      await run('INSERT INTO holidays (holiday_date, name, description) VALUES (?, ?, ?)', [h.holiday_date, h.name, h.description]);
    }
  }

  // Generate historical attendance for CS-A students for the last 10 working days
  const csAStudents = await all('SELECT id, roll_number FROM students WHERE class_id = ?', [csA.id]);
  
  // Dates for previous 10 weekdays
  const dates = [];
  const today = new Date();
  let d = new Date(today);
  let count = 0;
  while (count < 10) {
    d.setDate(d.getDate() - 1);
    const dayOfWeek = d.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Weekdays only
      const isoDate = d.toISOString().split('T')[0];
      dates.push(isoDate);
      count++;
    }
  }

  console.log(`Generating attendance for ${dates.length} past working days for ${csAStudents.length} students...`);
  
  await withTransaction(async ({ run }) => {
    for (const dateStr of dates) {
      for (const st of csAStudents) {
        // Specific student behaviors to simulate realistic threshold distribution
        let presentProbability = 0.92; // Default high attendance
        if (st.roll_number === 'CS-003') presentProbability = 0.58; // Low attendance (< 75%)
        if (st.roll_number === 'CS-007') presentProbability = 0.70; // Borderline (< 75%)

        for (let period = 1; period <= 7; period++) {
          const status = Math.random() < presentProbability ? 'PRESENT' : 'ABSENT';
          await run(
            `INSERT OR IGNORE INTO attendance_records (student_id, class_id, attendance_date, period_number, status)
             VALUES (?, ?, ?, ?, ?)`,
            [st.id, csA.id, dateStr, period, status]
          );
        }
      }
    }
  });

  console.log('Seeding completed successfully!');
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}

module.exports = { seed };
