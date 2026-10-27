// Consistent Attendance Calculations
export function calculateAttendancePercentage(attended, working) {
  const w = Number(working) || 0;
  const a = Number(attended) || 0;
  if (w <= 0) return 0.0;
  return Number(((a / w) * 100).toFixed(2));
}

export function isLowAttendance(percentage, threshold = 75.0) {
  return Number(percentage) < Number(threshold);
}

export function getAttendanceStatus(percentage, threshold = 75.0) {
  return isLowAttendance(percentage, threshold) ? 'SHORTAGE' : 'NORMAL';
}

export function formatDate(dateString) {
  if (!dateString) return '';
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][parseInt(parts[1], 10) - 1];
      const day = parts[2];
      return `${day} ${month} ${year}`;
    }
    return dateString;
  } catch (e) {
    return dateString;
  }
}
