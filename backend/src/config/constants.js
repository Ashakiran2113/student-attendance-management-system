module.exports = {
  PORT: process.env.PORT || 5000,
  DB_PATH: process.env.DB_PATH || './data/attendance.db',
  DEFAULT_ATTENDANCE_THRESHOLD: 75.0,
  PERIODS_PER_DAY: 7,
  STATUS: {
    PRESENT: 'PRESENT',
    ABSENT: 'ABSENT'
  },
  DEFAULT_PERIOD_TIMINGS: [
    { period: 1, label: 'Period 1', startTime: '09:00', endTime: '09:50' },
    { period: 2, label: 'Period 2', startTime: '09:55', endTime: '10:45' },
    { period: 3, label: 'Period 3', startTime: '10:50', endTime: '11:40' },
    { period: 4, label: 'Period 4', startTime: '11:45', endTime: '12:35' },
    { period: 5, label: 'Period 5', startTime: '13:30', endTime: '14:20' },
    { period: 6, label: 'Period 6', startTime: '14:25', endTime: '15:15' },
    { period: 7, label: 'Period 7', startTime: '15:20', endTime: '16:10' }
  ]
};
