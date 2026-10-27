const dashboardService = require('../services/dashboardService');

class DashboardController {
  async getMetrics(req, res, next) {
    try {
      const data = await dashboardService.getDashboardMetrics();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DashboardController();
