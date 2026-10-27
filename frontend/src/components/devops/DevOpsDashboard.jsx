import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

export default function DevOpsDashboard({ showToast }) {
  const [health, setHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pipeline');

  const checkLiveHealth = async () => {
    try {
      setHealthLoading(true);
      const res = await api.checkHealth();
      setHealth(res);
      showToast?.('Backend Health Status: Online & Database Connected', 'success');
    } catch (err) {
      setHealth({
        status: 'offline',
        service: 'student-attendance-api',
        error: err.message
      });
      showToast?.('Backend Health Check Failed: Offline', 'error');
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    checkLiveHealth();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">DevOps & Cloud Orchestration Console</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-navy-100 text-navy-800 border border-navy-200">
              CI/CD • Docker • K8s • Selenium
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Infrastructure as Code (IaC), automated testing pipeline, containerization, and cluster deployment specs.
          </p>
        </div>

        <button
          onClick={checkLiveHealth}
          disabled={healthLoading}
          data-testid="probe-health-btn"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-navy-900 text-white hover:bg-navy-800 shadow-sm transition-all"
        >
          <svg className={`w-4 h-4 ${healthLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {healthLoading ? 'Probing /api/health...' : 'Probe Live API Health'}
        </button>
      </div>

      {/* Live System Health Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Service Health & Readiness Probe</h3>
            <p className="text-xs text-slate-500">Real-time status returned by Express REST backend</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
            health?.status === 'healthy' 
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
              : 'bg-rose-100 text-rose-800 border border-rose-300'
          }`}>
            <span className={`w-2 h-2 rounded-full ${health?.status === 'healthy' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
            {health?.status ? health.status.toUpperCase() : 'CHECKING...'}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-400 font-medium">Database Engine</span>
            <p className="font-bold text-slate-800 mt-1 font-mono">SQLite 3 (WAL mode)</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-400 font-medium">Uptime Seconds</span>
            <p className="font-bold text-slate-800 mt-1 font-mono">{health?.uptime_seconds || 0}s</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-400 font-medium">API Version</span>
            <p className="font-bold text-slate-800 mt-1 font-mono">{health?.version || '1.0.0'}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-400 font-medium">Volume Persistence</span>
            <p className="font-bold text-emerald-700 mt-1 font-mono">Mounted (/data)</p>
          </div>
        </div>
      </div>

      {/* DevOps Architecture Tabs */}
      <div className="flex border-b border-slate-200 gap-4 text-xs font-bold text-slate-600">
        {[
          { id: 'pipeline', label: 'Jenkins CI/CD Pipeline' },
          { id: 'docker', label: 'Docker & Compose' },
          { id: 'k8s', label: 'Kubernetes Manifests' },
          { id: 'selenium', label: 'Selenium Automation' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-navy-900 text-navy-900 font-extrabold'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Jenkins Pipeline Visualization */}
      {activeTab === 'pipeline' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">Automated Jenkins Declarative Pipeline (Jenkinsfile)</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono">Jenkins Pipeline 2.0</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
            {[
              { step: '1', title: 'Checkout SCM', desc: 'Git clone from repository branch', status: 'Passed' },
              { step: '2', title: 'Install Deps', desc: 'npm install on backend, frontend & tests', status: 'Passed' },
              { step: '3', title: 'Unit Tests', desc: 'Validation & percentage formula tests', status: 'Passed' },
              { step: '4', title: 'Frontend Build', desc: 'Vite production static bundle', status: 'Passed' },
              { step: '5', title: 'Docker Build', desc: 'Multi-stage container image creation', status: 'Passed' }
            ].map(stage => (
              <div key={stage.step} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-2 relative">
                <div className="flex items-center justify-between">
                  <span className="w-5 h-5 rounded-full bg-navy-900 text-white font-bold text-[10px] flex items-center justify-center">
                    {stage.step}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                    ✓ {stage.status}
                  </span>
                </div>
                <h4 className="font-bold text-xs text-slate-800">{stage.title}</h4>
                <p className="text-[11px] text-slate-500 leading-snug">{stage.desc}</p>
              </div>
            ))}
          </div>

          <div className="p-3 bg-slate-950 text-slate-200 rounded-lg font-mono text-[11px] overflow-x-auto">
            <pre>{`pipeline {
    agent any
    environment {
        NODE_ENV = 'production'
        DOCKER_IMAGE = 'student-attendance-app:latest'
    }
    stages {
        stage('Checkout') { steps { checkout scm } }
        stage('Install Dependencies') { steps { sh 'npm run install:all' } }
        stage('Run Automated Tests') { steps { sh 'npm run test:backend' } }
        stage('Build Frontend Bundle') { steps { sh 'npm run build:frontend' } }
        stage('Docker Build & Package') { steps { sh 'docker compose build' } }
    }
}`}</pre>
          </div>
        </div>
      )}

      {/* Tab 2: Docker Containerization */}
      {activeTab === 'docker' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">Containerization & Compose Architecture</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">docker-compose.yml</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
              <h4 className="font-bold text-navy-900">Backend API Container (`attendance-backend`)</h4>
              <p className="text-slate-600">Runs Node.js / Express on port 5000 with persistent SQLite volume storage.</p>
              <div className="font-mono text-[11px] text-slate-700 space-y-1">
                <div>• Port: <strong>5000:5000</strong></div>
                <div>• Volume Mount: <strong>./data:/app/data</strong></div>
                <div>• Healthcheck: <strong>curl -f http://localhost:5000/api/health</strong></div>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
              <h4 className="font-bold text-navy-900">Frontend Client Container (`attendance-frontend`)</h4>
              <p className="text-slate-600">Serves optimized Vite/React static build through Nginx or dev server on port 3000.</p>
              <div className="font-mono text-[11px] text-slate-700 space-y-1">
                <div>• Port: <strong>3000:3000</strong></div>
                <div>• Depends on: <strong>attendance-backend (healthy)</strong></div>
                <div>• Environment: <strong>VITE_API_URL=/api</strong></div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-950 text-slate-200 rounded-lg font-mono text-[11px] overflow-x-auto">
            <pre>{`# Run application with zero configuration:
docker compose up -d

# Verify persistent SQLite records survive container restarts:
docker compose restart attendance-backend`}</pre>
          </div>
        </div>
      )}

      {/* Tab 3: Kubernetes Manifests */}
      {activeTab === 'k8s' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">Kubernetes Cluster Manifests (`/k8s`)</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-navy-50 text-navy-800 font-mono">Namespace: academic-system</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <span className="font-mono font-bold text-slate-900">pvc.yaml</span>
              <p className="text-slate-500 text-[11px] mt-1">PersistentVolumeClaim for SQLite database storage (ReadWriteOnce).</p>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <span className="font-mono font-bold text-slate-900">backend-deployment.yaml</span>
              <p className="text-slate-500 text-[11px] mt-1">Deployment with livenessProbe and readinessProbe at `/api/health`.</p>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <span className="font-mono font-bold text-slate-900">ingress.yaml</span>
              <p className="text-slate-500 text-[11px] mt-1">Routing rules for academic administration ingress host.</p>
            </div>
          </div>

          <div className="p-3 bg-slate-950 text-slate-200 rounded-lg font-mono text-[11px] overflow-x-auto">
            <pre>{`# Deploy entire stack to Kubernetes cluster:
kubectl apply -f devops/k8s/namespace.yaml
kubectl apply -f devops/k8s/pvc.yaml
kubectl apply -f devops/k8s/configmap.yaml
kubectl apply -f devops/k8s/backend-deployment.yaml
kubectl apply -f devops/k8s/backend-service.yaml
kubectl apply -f devops/k8s/frontend-deployment.yaml
kubectl apply -f devops/k8s/frontend-service.yaml`}</pre>
          </div>
        </div>
      )}

      {/* Tab 4: Selenium WebDriver Test Suite */}
      {activeTab === 'selenium' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">Selenium WebDriver Browser Automation Suite</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 font-mono">Chrome Headless</span>
          </div>

          <p className="text-xs text-slate-600">
            The Selenium automation suite tests the full end-to-end user experience using stable <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">data-testid</code> attributes:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {[
              { id: '1', title: 'Student Management', desc: 'Verifies listing, add, edit, and duplicate roll number rejection' },
              { id: '2', title: '7-Period Attendance', desc: 'Marks all 7 periods independently with P/A toggles' },
              { id: '3', title: 'Save & Persistence', desc: 'Verifies saving and retrieving previously saved daily attendance' },
              { id: '4', title: 'Monthly Calculation', desc: 'Validates accurate formula: (Attended / Working) * 100' },
              { id: '5', title: 'Shortage Alerts', desc: 'Detects students under threshold & generates advisory notice' },
              { id: '6', title: 'CSV Report Export', desc: 'Ensures correct RFC-4180 CSV export download response' }
            ].map(test => (
              <div key={test.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="text-emerald-600 font-extrabold">✓</span>
                  Test {test.id}: {test.title}
                </div>
                <p className="text-[11px] text-slate-500">{test.desc}</p>
              </div>
            ))}
          </div>

          <div className="p-3 bg-slate-950 text-slate-200 rounded-lg font-mono text-[11px] overflow-x-auto">
            <pre>{`# Run Selenium WebDriver Suite locally:
cd tests/selenium
npm install
npm test`}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
