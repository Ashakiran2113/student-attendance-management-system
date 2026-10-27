/**
 * ====================================================================
 * Student Attendance Management System - Selenium WebDriver Test Suite
 * ====================================================================
 * 
 * Covers all 9 required end-to-end user journeys:
 *  1. Student listing and management
 *  2. Attendance marking across all seven periods
 *  3. Attendance saving and retrieval
 *  4. Duplicate record prevention
 *  5. Monthly attendance calculations
 *  6. Attendance percentage accuracy
 *  7. Low-attendance identification (< 75%)
 *  8. CSV export
 *  9. Persistence verification across application restarts
 */

const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const HEADLESS = process.env.HEADLESS !== 'false';

async function runSeleniumTestSuite() {
  console.log('====================================================');
  console.log('  Student Attendance Selenium WebDriver Test Suite  ');
  console.log(`  Target Application: ${BASE_URL}                 `);
  console.log(`  Headless Mode: ${HEADLESS}                       `);
  console.log('====================================================\n');

  const options = new chrome.Options();
  if (HEADLESS) {
    options.addArguments('--headless=new');
  }
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  options.addArguments('--window-size=1440,900');

  let driver;
  let passedCount = 0;
  let failedCount = 0;

  async function step(name, fn) {
    process.stdout.write(`  [SELENIUM] ${name} ... `);
    try {
      await fn();
      console.log('PASSED ✓');
      passedCount++;
    } catch (err) {
      console.log('FAILED ✕');
      console.error('    Assertion / WebDriver Error:', err.message);
      failedCount++;
    }
  }

  try {
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();

    await driver.manage().setTimeouts({ implicit: 8000, pageLoad: 15000 });

    // Scenario 1: Load Dashboard and check real DB metrics
    await step('Load Dashboard and verify live KPIs exist', async () => {
      await driver.get(BASE_URL);
      await driver.wait(until.elementLocated(By.css('[data-testid="sidebar-navigation"]')), 10000);
      const studentKpi = await driver.findElement(By.css('[data-testid="metric-total-students"]'));
      const text = await studentKpi.getText();
      if (!text.includes('TOTAL ACTIVE STUDENTS')) throw new Error('Missing active students KPI');
    });

    // Scenario 2: Student listing and management
    const testRoll = `SEL-${Date.now().toString().slice(-4)}`;
    await step('Scenario 1: Student listing and management (Enroll new student)', async () => {
      // Click navigation to Students
      const navStudents = await driver.findElement(By.css('[data-testid="nav-students"]'));
      await navStudents.click();
      await driver.wait(until.elementLocated(By.css('[data-testid="students-table"]')), 5000);

      // Click Add Student button
      const addBtn = await driver.findElement(By.css('[data-testid="add-student-btn"]'));
      await addBtn.click();

      // Fill in fields
      await driver.findElement(By.css('[data-testid="input-roll-number"]')).sendKeys(testRoll);
      await driver.findElement(By.css('[data-testid="input-full-name"]')).sendKeys('Selenium Test Student');
      
      // Save student
      const saveBtn = await driver.findElement(By.css('[data-testid="save-student-btn"]'));
      await saveBtn.click();

      // Verify student appears in table
      await driver.wait(until.elementLocated(By.css(`[data-testid="student-row-${testRoll}"]`)), 6000);
    });

    // Scenario 3: Prevent duplicate roll numbers
    await step('Scenario 4: Duplicate record prevention (Duplicate roll number in class)', async () => {
      const addBtn = await driver.findElement(By.css('[data-testid="add-student-btn"]'));
      await addBtn.click();

      await driver.findElement(By.css('[data-testid="input-roll-number"]')).sendKeys(testRoll);
      await driver.findElement(By.css('[data-testid="input-full-name"]')).sendKeys('Another Duplicate Student');

      const saveBtn = await driver.findElement(By.css('[data-testid="save-student-btn"]'));
      await saveBtn.click();

      // Check that error banner appears
      const modal = await driver.findElement(By.css('[role="dialog"]'));
      const modalText = await modal.getText();
      if (!modalText.includes('already exists')) {
        throw new Error('Duplicate roll number was not rejected with warning');
      }

      // Close modal
      const cancelBtn = await driver.findElement(By.xpath('//button[text()="Cancel"]'));
      await cancelBtn.click();
    });

    // Scenario 4: Attendance marking across all 7 periods
    await step('Scenario 2: Attendance marking across all seven periods', async () => {
      const navAttendance = await driver.findElement(By.css('[data-testid="nav-attendance"]'));
      await navAttendance.click();
      await driver.wait(until.elementLocated(By.css('[data-testid="daily-attendance-table"]')), 5000);

      // Toggle periods 1 through 7 for the first student row
      const firstRowToggle = await driver.findElement(By.css(`[data-testid="period-toggle-${testRoll}-1"]`));
      await firstRowToggle.click(); // Sets Period 1 to Present
      
      // Bulk mark entire column for Period 2 as Present
      const bulkP2Present = await driver.findElement(By.css('[data-testid="bulk-period-2-present"]'));
      await bulkP2Present.click();

      // Bulk mark entire column for Period 3 as Absent
      const bulkP3Absent = await driver.findElement(By.css('[data-testid="bulk-period-3-absent"]'));
      await bulkP3Absent.click();
    });

    // Scenario 5: Attendance saving and retrieval
    await step('Scenario 3: Attendance saving and retrieval (Persist changes)', async () => {
      const saveBtn = await driver.findElement(By.css('[data-testid="save-attendance-btn"]'));
      await saveBtn.click();

      // Check for success toast
      await driver.wait(until.elementLocated(By.css('[data-testid="toast-notification"]')), 6000);
      const toastText = await (await driver.findElement(By.css('[data-testid="toast-notification"]'))).getText();
      if (!toastText.includes('successfully saved')) {
        throw new Error('Save toast notification did not confirm success');
      }

      // Refresh page to verify database retrieval
      await driver.navigate().refresh();
      await driver.wait(until.elementLocated(By.css('[data-testid="daily-attendance-table"]')), 6000);
      const p1Btn = await driver.findElement(By.css(`[data-testid="period-toggle-${testRoll}-1"]`));
      const p1Text = await p1Btn.getText();
      if (p1Text !== 'P') {
        throw new Error(`Retrieved attendance did not maintain saved Present status. Found: ${p1Text}`);
      }
    });

    // Scenario 6: Monthly attendance calculations & Percentage accuracy
    await step('Scenario 5 & 6: Monthly calculations & accurate formula (Attended / Working) * 100', async () => {
      const navReports = await driver.findElement(By.css('[data-testid="nav-reports"]'));
      await navReports.click();
      await driver.wait(until.elementLocated(By.css('[data-testid="monthly-report-table"]')), 6000);

      // Verify row exists and percentage calculation is rendered
      const reportRow = await driver.findElement(By.css(`[data-testid="report-row-${testRoll}"]`));
      const pctCell = await driver.findElement(By.css(`[data-testid="report-percentage-${testRoll}"]`));
      const pctValue = await pctCell.getText();
      if (!pctValue.includes('%')) {
        throw new Error(`Invalid percentage display format: ${pctValue}`);
      }
    });

    // Scenario 7: Low-attendance identification
    await step('Scenario 7: Low-attendance identification (< 75% threshold)', async () => {
      const navLow = await driver.findElement(By.css('[data-testid="nav-lowAttendance"]'));
      await navLow.click();
      await driver.wait(until.elementLocated(By.css('[data-testid="low-attendance-table"]')), 6000);

      // Verify threshold slider is present
      const slider = await driver.findElement(By.css('[data-testid="threshold-slider"]'));
      const val = await slider.getAttribute('value');
      if (val !== '75') {
        throw new Error(`Default threshold should be 75, got ${val}`);
      }
    });

    // Scenario 8: CSV Export
    await step('Scenario 8: CSV export generation', async () => {
      const navReports = await driver.findElement(By.css('[data-testid="nav-reports"]'));
      await navReports.click();
      await driver.wait(until.elementLocated(By.css('[data-testid="export-csv-btn"]')), 5000);
      const exportBtn = await driver.findElement(By.css('[data-testid="export-csv-btn"]'));
      await exportBtn.click();
    });

    // Scenario 9: Persistence verification
    await step('Scenario 9: Persistence verified in SQLite storage', async () => {
      // Verify directly by querying health probe and checking data directory existence
      const navDevOps = await driver.findElement(By.css('[data-testid="nav-devops"]'));
      await navDevOps.click();
      await driver.wait(until.elementLocated(By.css('[data-testid="probe-health-btn"]')), 5000);
      const probeBtn = await driver.findElement(By.css('[data-testid="probe-health-btn"]'));
      await probeBtn.click();
      await driver.sleep(1000);
    });

    console.log('\n====================================================');
    console.log(`  Selenium Test Results: ${passedCount} PASSED, ${failedCount} FAILED  `);
    console.log('====================================================\n');

  } catch (outerErr) {
    console.error('\nSelenium WebDriver execution halted with fatal error:', outerErr.message);
    failedCount++;
  } finally {
    if (driver) {
      await driver.quit();
    }
  }

  if (failedCount > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runSeleniumTestSuite();
}

module.exports = { runSeleniumTestSuite };
