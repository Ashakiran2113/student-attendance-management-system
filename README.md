# Student Attendance Management System Using DevOps Tools

[![React](https://img.shields.io/badge/Frontend-React%20%7C%20Vite%20%7C%20TailwindCSS-blue.svg)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-green.svg)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-SQLite%203-lightgrey.svg)](https://www.sqlite.org/)
[![Docker](https://img.shields.io/badge/Containers-Docker%20%7C%20Compose-2496ED.svg)](https://www.docker.com/)
[![CI/CD](https://img.shields.io/badge/Pipeline-Jenkins-D24939.svg)](https://www.jenkins.io/)
[![Orchestration](https://img.shields.io/badge/Orchestration-Kubernetes-326CE5.svg)](https://kubernetes.io/)
[![Testing](https://img.shields.io/badge/Automation-Selenium%20WebDriver-43B02A.svg)](https://www.selenium.dev/)

A professional, enterprise-grade **Student Attendance Management System** built with a modular full-stack architecture and comprehensive DevOps automation. Features daily 7-period attendance tracking, aggregate monthly reports, low-attendance alerts, CSV exports, persistent SQLite database storage, automated unit tests, Selenium browser automation, Docker containerization, Jenkins CI/CD pipelines, and Kubernetes deployment manifests.

---

## Architecture Overview

```
                                  +---------------------------------------+
                                  |         Client Browser / UI           |
                                  |   (React + Vite + Tailwind CSS)       |
                                  +-------------------+-------------------+
                                                      |
                                                      | HTTP / REST (JSON)
                                                      v
                                  +---------------------------------------+
                                  |         Express REST API              |
                                  |  - Controllers, Services, Middleware  |
                                  |  - Centralized Error Handling         |
                                  +-------------------+-------------------+
                                                      |
                                                      | Transactions / SQL
                                                      v
                                  +---------------------------------------+
                                  |       Persistent SQLite Database      |
                                  |   (Students, Records, Settings, WAL)  |
                                  +---------------------------------------+
                                                      ^
                                                      | Persistent Volume
               +--------------------------------------+--------------------------------------+
               |                                                                             |
      +--------+--------+                                                           +--------+--------+
      |  Docker Compose |                                                           | Kubernetes PVC  |
      |   Data Volume   |                                                           | ReadWriteOnce   |
      +-----------------+                                                           +-----------------+
```

---

## 1. Technology Stack

- **Frontend**: React 18, Vite, JavaScript, Tailwind CSS (custom academic navy & status palette), Lucide SVG icons.
- **Backend**: Node.js, Express.js REST API, CORS, environment-based configuration.
- **Database**: SQLite 3 with WAL journal mode, normalized schema, foreign keys, unique period constraints, and transactional bulk upserts.
- **DevOps Tools**:
  - **Version Control**: Git & GitHub with standardized `.gitignore` and branching.
  - **CI/CD**: Jenkins Declarative Pipeline (`Jenkinsfile`) with parallel dependency installation, testing, frontend bundle compilation, and Docker builds.
  - **Containerization**: Docker multi-stage images, `docker-compose.yml` with persistent volume mounting and container healthchecks.
  - **Orchestration**: Kubernetes manifests (Namespace, PVC, ConfigMap, Secret template, Deployments, Services, and Ingress).
  - **Browser Automation**: Selenium WebDriver (JavaScript + headless Chrome) covering 9 core end-to-end workflows.

---

## 2. Core Functional Modules

### 1. Executive Dashboard
- **Database-Driven KPIs**: Real-time counts of active students, today's completion percentage, monthly average attendance, and students below the attendance threshold.
- **Attendance Trends**: Visual timeline showing daily percentage trends across classes.
- **Recent Activity**: Live log of recorded class sessions with Present/Absent breakdowns.
- **Quick Administrative Actions**: Single-click access to roll call, student enrollment, and reports.

### 2. Student Directory & Management (CRUD)
- Complete student lifecycle: Add, view, edit, search, filter (by department, class, status), and sort.
- **Validation**: Enforces mandatory fields and validates roll number uniqueness within each class.
- **Historical Data Preservation**: When students are deactivated, historical attendance records are retained to maintain regulatory audit integrity.

### 3. Daily Class Attendance (7-Period Roll Call) — Highest Priority
- **7-Period Grid**: Displays students with interactive period buttons (1 to 7) toggling between `Unmarked (null)`, `Present`, and `Absent`.
- **Bulk Actions**:
  - Global: "Mark All Present" and "Mark All Absent" across all 7 periods.
  - Per-Period Column Actions: Bulk mark individual columns (e.g. Set all Period 1 to Present).
- **Transactional Bulk Saves**: Uses SQLite transactions (`BEGIN TRANSACTION ... COMMIT`) with idempotent `ON CONFLICT` upserts.
- **Unsaved Changes Guard**: Modal dialog warns users if navigating away or changing classes with unsaved modifications.
- **Persistence & Retrieval**: Existing attendance is automatically loaded when selecting a date and class; never overwritten with default values.

### 4. Attendance History & Audit Trail
- Multi-faceted filter engine: Date ranges, department, class, individual student, period number (1–7), and status.
- Chronological table tracking timestamps and updates.

### 5. Monthly Reports & Transcripts
- **Mathematical Formula**:
  $$\text{Attendance Percentage} = \left(\frac{\text{Periods Attended}}{\text{Scheduled Working Periods}}\right) \times 100$$
- **Safe Handling**: Gracefully handles zero working periods without division-by-zero errors.
- **Student Breakdown**: Modal displaying day-by-day and period-by-period matrices for individual students.
- **CSV Export**: Streams RFC-4180 compliant CSV reports directly from the API.
- **Printable Transcripts**: Dedicated print styling for official university attendance transcripts.

### 6. Low-Attendance Shortage Intervention
- Dynamic threshold slider (default 75%, adjustable from 50% to 95%).
- Instant identification of students under the minimum threshold with deficit calculation.
- **Formal Advisory Notice Generator**: Generates formal letters to parents/guardians warning of potential exam disbarment.

### 7. Institutional Configuration
- Institution name, academic year, and default attendance thresholds.
- Seven-period timetable configuration with period start/end timings.
- Management of departments, classes/sections, and academic holiday calendars.

### 8. DevOps & Cloud Orchestration Console
- Interactive dashboard tab providing real-time backend health probes (`/api/health`).
- Visual review of Jenkins stages, Docker compose topology, and Kubernetes manifests.

---

## 3. Database Schema & Integrity

```sql
-- Core Schema Highlights (backend/src/database/schema.sql)
CREATE TABLE students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    roll_number TEXT NOT NULL,
    full_name TEXT NOT NULL,
    department_id INTEGER NOT NULL REFERENCES departments(id),
    class_id INTEGER NOT NULL REFERENCES classes(id),
    academic_year TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    UNIQUE(class_id, roll_number)
);

CREATE TABLE attendance_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    attendance_date TEXT NOT NULL,
    period_number INTEGER NOT NULL CHECK(period_number BETWEEN 1 AND 7),
    status TEXT NOT NULL CHECK(status IN ('PRESENT', 'ABSENT')),
    UNIQUE(student_id, attendance_date, period_number)
);
```

---

## 4. Getting Started (Local Development)

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Initialize database schema and seed realistic students and records
npm run init-db
npm run seed

# Run automated backend tests
npm test

# Start backend REST API server (Port 5000)
npm start
```
The backend health check will be accessible at: `http://localhost:5000/api/health`

### 2. Frontend Setup
```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server (Port 3000)
npm run dev
```
Open your browser at: `http://localhost:3000`

---

## 5. Docker & Containerized Deployment

Run the complete multi-container stack with SQLite volume persistence:

```bash
# Build and run containers in detached mode
docker compose up -d --build

# View container status and health
docker compose ps

# Inspect logs
docker compose logs -f

# Verify database persistence survives restarts
docker compose restart attendance-backend

# Tear down containers (data volume remains intact)
docker compose down
```

---

## 6. Kubernetes Cluster Deployment

The Kubernetes manifests are located in `devops/k8s/`:

```bash
# 1. Create dedicated namespace
kubectl apply -f devops/k8s/namespace.yaml

# 2. Create Persistent Volume Claim for SQLite storage
kubectl apply -f devops/k8s/pvc.yaml

# 3. Create ConfigMap and Secret templates
kubectl apply -f devops/k8s/configmap.yaml
kubectl apply -f devops/k8s/secret-template.yaml

# 4. Deploy Backend & Service
kubectl apply -f devops/k8s/backend-deployment.yaml
kubectl apply -f devops/k8s/backend-service.yaml

# 5. Deploy Frontend & Service
kubectl apply -f devops/k8s/frontend-deployment.yaml
kubectl apply -f devops/k8s/frontend-service.yaml

# 6. Apply Ingress router
kubectl apply -f devops/k8s/ingress.yaml
```

---

## 7. Selenium WebDriver Automated Testing

The browser automation suite covers all 9 required test scenarios:

```bash
# Navigate to selenium tests directory
cd tests/selenium

# Install testing dependencies
npm install

# Run the test suite (Headless Chrome)
npm test

# Run in visual (non-headless) mode for debugging
HEADLESS=false npm test
```

### Covered Test Scenarios:
1. **Student Listing & Management**: Enroll new student and verify table row.
2. **Attendance Marking**: Mark periods 1 through 7 independently.
3. **Attendance Saving & Retrieval**: Persist records to SQLite and verify on refresh.
4. **Duplicate Record Prevention**: Assert duplicate roll numbers are rejected.
5. **Monthly Calculation**: Audit working periods count.
6. **Attendance Percentage Accuracy**: Validate formula `(Attended / Working) * 100`.
7. **Low-Attendance Identification**: Detect students below 75% threshold.
8. **CSV Export**: Verify download endpoint response.
9. **Persistence**: Ensure records persist across server cycles.

---

## 8. REST API Specification

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health and readiness probe |
| `GET` | `/api/dashboard/metrics` | Real-time database KPIs and trends |
| `GET` | `/api/students` | List students with search, filters, and sorting |
| `POST` | `/api/students` | Enroll a new student |
| `GET` | `/api/students/:id` | Get student profile |
| `PUT` | `/api/students/:id` | Update student profile |
| `PATCH`| `/api/students/:id/status` | Activate / Deactivate student |
| `GET` | `/api/attendance/daily` | Get 7-period attendance grid for a date |
| `POST` | `/api/attendance/bulk` | Transactional bulk save/update of records |
| `GET` | `/api/attendance/history` | Filtered historical attendance logs |
| `GET` | `/api/reports/monthly` | Class-wise monthly attendance calculations |
| `GET` | `/api/reports/student/:id` | Student monthly matrix breakdown |
| `GET` | `/api/reports/low-attendance` | Students falling below threshold |
| `GET` | `/api/reports/export/csv` | Download RFC-4180 compliant CSV report |
| `GET` | `/api/settings` | Retrieve application settings |
| `PUT` | `/api/settings` | Update application configuration |
| `GET` | `/api/settings/departments` | List all departments |
| `GET` | `/api/settings/classes` | List all classes |
| `GET` | `/api/settings/holidays` | Academic holiday calendar |

---

## 9. Security & Best Practices

- **Zero Hardcoded Secrets**: Secret templates (`secret-template.yaml`) and `.env.example` configurations prevent credential leaks.
- **Parameterized SQL Queries**: All queries utilize parameterized placeholders (`?`) to prevent SQL injection.
- **Transactional Atomic Writes**: Bulk roll call submissions execute inside atomic SQLite transactions (`BEGIN TRANSACTION ... COMMIT`).
- **Data Integrity**: Foreign key constraints and unique constraints guarantee referential consistency.
- **Responsive & Accessible**: Strict semantic markup and stable `data-testid` selectors enable continuous UI testing.
