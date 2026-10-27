# Selenium WebDriver Automation Suite Guide

This automated test suite provides end-to-end browser automation for the **Student Attendance Management System** using Selenium WebDriver with JavaScript and Chrome.

## Covered Test Scenarios (9 Core Flows)
1. **Student Listing & Management**: Validates roster query, student enrollment, and profile updates.
2. **Attendance Marking across 7 Periods**: Toggles individual periods 1–7 as Present / Absent.
3. **Attendance Saving & Retrieval**: Persists transactional bulk records and reloads on refresh.
4. **Duplicate Record Prevention**: Verifies rejection of duplicate roll numbers within the same class.
5. **Monthly Attendance Calculations**: Audits working periods and attended periods aggregation.
6. **Attendance Percentage Accuracy**: Verifies mathematical formula: `(Periods Attended / Working Periods) * 100`.
7. **Low-Attendance Identification**: Validates detection of students falling under the 75% threshold.
8. **CSV Report Export**: Triggers RFC-4180 CSV generation and validates download response.
9. **Persistence After Restart**: Verifies SQLite database WAL file durability across restarts.

## Prerequisites
- Node.js 18+ installed
- Google Chrome browser installed
- ChromeDriver (matched with your Chrome browser version)

## Local Execution Instructions

1. Start the application services:
   ```bash
   # Terminal 1: Backend
   cd backend
   npm install
   npm run init-db
   npm run seed
   npm start

   # Terminal 2: Frontend
   cd frontend
   npm install
   npm run dev
   ```

2. Run the Selenium Test Suite:
   ```bash
   cd tests/selenium
   npm install
   npm test
   ```

3. Optional Environment Variables:
   - `TEST_BASE_URL`: Defaults to `http://localhost:3000`
   - `HEADLESS`: Defaults to `true` (set to `false` for visual browser execution)

   Example for visual debugging:
   ```bash
   HEADLESS=false npm test
   ```

## Jenkins CI/CD Integration
In the declarative `Jenkinsfile`, the Selenium suite runs automatically within the verification stage using headless Chrome:

```groovy
stage('Browser Automation (Selenium)') {
    steps {
        dir('tests/selenium') {
            sh 'npm install'
            sh 'HEADLESS=true npm test'
        }
    }
}
```
