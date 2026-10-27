const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/metrics', (req, res, next) => dashboardController.getMetrics(req, res, next));

module.exports = router;
