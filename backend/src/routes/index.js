const express = require('express');
const router = express.Router();
const { get } = require('../config/database');

const studentRoutes = require('./studentRoutes');
const attendanceRoutes = require('./attendanceRoutes');
const reportRoutes = require('./reportRoutes');
const settingsRoutes = require('./settingsRoutes');
const dashboardRoutes = require('./dashboardRoutes');

// Health Check Endpoint
router.get('/health', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    const testQuery = await get('SELECT 1 as is_alive');
    if (testQuery && testQuery.is_alive === 1) {
      dbStatus = 'connected';
    }
  } catch (err) {
    dbStatus = `error: ${err.message}`;
  }

  res.json({
    status: dbStatus === 'connected' ? 'healthy' : 'degraded',
    service: 'student-attendance-management-api',
    version: '1.0.0',
    uptime_seconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: {
      engine: 'SQLite',
      status: dbStatus
    }
  });
});

// Mount modular subroutes
router.use('/students', studentRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/reports', reportRoutes);
router.use('/settings', settingsRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
