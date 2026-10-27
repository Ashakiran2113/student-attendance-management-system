// Centralized Error Handling Middleware
function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${req.method} ${req.url} - ${err.message}`, err.stack);

  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

  res.status(statusCode).json({
    success: false,
    error: {
      message: err.message || 'An unexpected internal server error occurred',
      statusCode: statusCode,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }
  });
}

// 404 Route Not Found Handler
function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    error: {
      message: `API endpoint '${req.method} ${req.originalUrl}' not found`,
      statusCode: 404
    }
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};
