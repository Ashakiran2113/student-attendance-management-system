const app = require('./app');
const { PORT } = require('./config/constants');
const { initDatabase } = require('./database/initDb');
const { seed } = require('./database/seed');
const { get } = require('./config/database');

async function startServer() {
  try {
    console.log('Verifying database schema...');
    await initDatabase();

    // Check if students exist; if not, automatically seed default dataset
    const studentCountRow = await get('SELECT COUNT(*) as count FROM students');
    if (!studentCountRow || studentCountRow.count === 0) {
      console.log('No students found in database. Running initial seed data...');
      await seed();
    } else {
      console.log(`Database already populated with ${studentCountRow.count} students.`);
    }

    const server = app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`  Student Attendance API Server running on port ${PORT}`);
      console.log(`  Health Check: http://localhost:${PORT}/api/health`);
      console.log(`====================================================`);
    });

    const shutdown = () => {
      console.log('\nReceived kill signal. Gracefully closing HTTP server...');
      server.close(() => {
        console.log('Server closed successfully.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
