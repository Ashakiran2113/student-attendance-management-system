const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Ensure test database isolation
process.env.DB_PATH = './data/test_attendance.db';
const { run, get, all, exec } = require('../src/config/database');
const { initDatabase } = require('../src/database/initDb');
const studentService = require('../src/services/studentService');
const attendanceService = require('../src/services/attendanceService');
const reportService = require('../src/services/reportService');

let passedTests = 0;
let failedTests = 0;

async function test(name, fn) {
  try {
    process.stdout.write(`  [TEST] ${name} ... `);
    await fn();
    console.log('PASSED');
    passedTests++;
  } catch (err) {
    console.log('FAILED');
    console.error('    Error:', err.message);
    failedTests++;
  }
}

async function runTestSuite() {
  console.log('====================================================');
  console.log('  Running Automated Backend & Business Logic Tests  ');
  console.log('====================================================\n');

  // Initialize test database
  await initDatabase();

  console.log('--- Suite 1: Student Management & Validation ---');

  let testClass;
  let testDept;
  await test('Verify default departments and classes exist', async () => {
    testDept = await get('SELECT id FROM departments WHERE code = ?', ['CSE']);
    assert(testDept, 'CSE department must exist');
    testClass = await get('SELECT id FROM classes WHERE name = ?', ['CS-A']);
    assert(testClass, 'CS-A class must exist');
  });

  let createdStudent;
  const testRoll = `TEST-${Date.now()}`;
  await test('Create new student with required fields', async () => {
    createdStudent = await studentService.createStudent({
      roll_number: testRoll,
      full_name: 'Test Candidate',
      department_id: testDept.id,
      class_id: testClass.id,
      academic_year: '2024-2025',
      email: 'test@campus.edu'
    });
    assert.strictEqual(createdStudent.roll_number, testRoll);
    assert.strictEqual(createdStudent.is_active, 1);
  });

  await test('Prevent duplicate roll number in same class', async () => {
    let duplicateErrorThrown = false;
    try {
      await studentService.createStudent({
        roll_number: testRoll,
        full_name: 'Duplicate Candidate',
        department_id: testDept.id,
        class_id: testClass.id,
        academic_year: '2024-2025'
      });
    } catch (err) {
      duplicateErrorThrown = true;
      assert(err.message.includes('already exists'), 'Should return duplicate error message');
    }
    assert.strictEqual(duplicateErrorThrown, true, 'Duplicate roll number must be rejected');
  });

  await test('Update student details', async () => {
    const updated = await studentService.updateStudent(createdStudent.id, {
      full_name: 'Test Candidate Updated',
      phone: '9999999999'
    });
    assert.strictEqual(updated.full_name, 'Test Candidate Updated');
    assert.strictEqual(updated.phone, '9999999999');
  });

  console.log('\n--- Suite 2: Seven-Period Daily Attendance ---');

  const testDate = '2025-01-15';
  await test('Daily attendance grid returns 7 periods with unmarked status clearly null', async () => {
    const grid = await attendanceService.getDailyAttendance(testClass.id, testDate);
    assert.strictEqual(grid.periods_per_day, 7);
    assert(grid.students.length > 0, 'Class must contain students');

    const found = grid.students.find(s => s.student_id === createdStudent.id);
    assert(found, 'Created student must be present in daily grid');
    assert.strictEqual(found.periods.length, 7);
    // Unmarked periods must be null, not default PRESENT or ABSENT
    assert.strictEqual(found.periods[0].status, null, 'Unmarked period must have status null');
  });

  await test('Save daily attendance for 7 periods in transaction', async () => {
    const recordsToSave = [
      { student_id: createdStudent.id, period_number: 1, status: 'PRESENT' },
      { student_id: createdStudent.id, period_number: 2, status: 'PRESENT' },
      { student_id: createdStudent.id, period_number: 3, status: 'ABSENT' },
      { student_id: createdStudent.id, period_number: 4, status: 'PRESENT' },
      { student_id: createdStudent.id, period_number: 5, status: 'PRESENT' },
      { student_id: createdStudent.id, period_number: 6, status: 'PRESENT' },
      { student_id: createdStudent.id, period_number: 7, status: 'ABSENT' }
    ];

    const savedGrid = await attendanceService.saveDailyAttendanceBulk(testClass.id, testDate, recordsToSave);
    const updatedStudent = savedGrid.students.find(s => s.student_id === createdStudent.id);
    assert.strictEqual(updatedStudent.present_count, 5);
    assert.strictEqual(updatedStudent.absent_count, 2);
    assert.strictEqual(updatedStudent.periods[0].status, 'PRESENT');
    assert.strictEqual(updatedStudent.periods[2].status, 'ABSENT');
  });

  await test('Update previously saved attendance records (idempotent UPSERT)', async () => {
    // Switch period 3 from ABSENT to PRESENT
    const updateRecord = [
      { student_id: createdStudent.id, period_number: 3, status: 'PRESENT' }
    ];
    const savedGrid = await attendanceService.saveDailyAttendanceBulk(testClass.id, testDate, updateRecord);
    const student = savedGrid.students.find(s => s.student_id === createdStudent.id);
    assert.strictEqual(student.periods[2].status, 'PRESENT');
    assert.strictEqual(student.present_count, 6);
    assert.strictEqual(student.absent_count, 1);
  });

  await test('Reject invalid period number and invalid status', async () => {
    let errorCaught = false;
    try {
      await attendanceService.saveDailyAttendanceBulk(testClass.id, testDate, [
        { student_id: createdStudent.id, period_number: 8, status: 'PRESENT' } // Invalid period
      ]);
    } catch (err) {
      errorCaught = true;
    }
    assert.strictEqual(errorCaught, true, 'Period 8 must be rejected');

    let statusErrorCaught = false;
    try {
      await attendanceService.saveDailyAttendanceBulk(testClass.id, testDate, [
        { student_id: createdStudent.id, period_number: 1, status: 'EXCUSED' } // Invalid status
      ]);
    } catch (err) {
      statusErrorCaught = true;
    }
    assert.strictEqual(statusErrorCaught, true, 'Status EXCUSED must be rejected');
  });

  console.log('\n--- Suite 3: Monthly Reports & Percentage Calculations ---');

  await test('Calculate accurate attendance percentage: (Attended / Working) * 100', async () => {
    const report = await reportService.getMonthlyReport({ classId: testClass.id, month: '2025-01' });
    const stReport = report.students.find(s => s.student_id === createdStudent.id);
    assert(stReport, 'Student report must exist');
    assert.strictEqual(stReport.periods_attended, 6);
    assert(stReport.working_periods > 0, 'Working periods must be positive');
    const expectedPct = Number(((6 / stReport.working_periods) * 100).toFixed(2));
    assert.strictEqual(stReport.attendance_percentage, expectedPct);
  });

  await test('Safe handling of zero working periods without division by zero', async () => {
    const emptyReport = await reportService.getMonthlyReport({ classId: testClass.id, month: '2028-12' });
    assert.strictEqual(emptyReport.scheduled_working_periods, 0);
    assert.strictEqual(emptyReport.average_attendance_percentage, 0.0);
  });

  await test('Identify low attendance student when percentage < 75%', async () => {
    const lowAtt = await reportService.getLowAttendanceStudents({ classId: testClass.id, month: '2025-01', threshold: 90 });
    assert(lowAtt.students.some(s => s.student_id === createdStudent.id), 'Student with 6/7 (~85.7%) should be under 90% threshold');
  });

  await test('Generate CSV Export with correct RFC-4180 format', async () => {
    const csv = await reportService.generateCsvExport({ classId: testClass.id, month: '2025-01' });
    assert(csv.includes('Roll Number,Student Name,Department,Class'), 'CSV must contain headers');
    assert(csv.includes(testRoll), 'CSV must contain student record');
  });

  console.log('\n--- Suite 4: Data Preservation on Deactivation ---');

  await test('Deactivating student preserves historical attendance records', async () => {
    const result = await studentService.deleteStudent(createdStudent.id);
    assert.strictEqual(result.deactivated, true, 'Student with attendance records must be deactivated rather than purged');
    
    // Check that historical records are still intact
    const records = await all('SELECT COUNT(*) as count FROM attendance_records WHERE student_id = ?', [createdStudent.id]);
    assert.strictEqual(records[0].count, 7, 'All 7 attendance records must remain intact');
  });

  console.log('\n====================================================');
  console.log(`  Tests Completed: ${passedTests} PASSED, ${failedTests} FAILED  `);
  console.log('====================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runTestSuite().catch(err => {
    console.error('Test suite runner crashed:', err);
    process.exit(1);
  });
}

module.exports = { runTestSuite };
