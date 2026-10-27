require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { requestLogger } = require('./middleware/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const apiRoutes = require('./routes/index');

const app = express();

// Security and CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(requestLogger);

// API Documentation / root welcome message
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Student Attendance Management System API',
    documentation: '/api/health',
    status: 'online'
  });
});

// Primary REST API routes
app.use('/api', apiRoutes);

// 404 handler
app.use(notFoundHandler);

// Central error handler
app.use(errorHandler);

module.exports = app;
