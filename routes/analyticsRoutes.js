const express = require('express');
const router = express.Router();
const {
  getTotalSpending,
  getCategoryBreakdown,
  getMonthlyTrends,
  getDailyWeeklyStats
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

// Execute auth protection on all analytics routes universally
router.use(protect);

// @route   GET /api/analytics/total
// @desc    Sum of standard valid payments
router.get('/total', getTotalSpending);

// @route   GET /api/analytics/category
// @desc    Ranked transaction summaries by category
router.get('/category', getCategoryBreakdown);

// @route   GET /api/analytics/monthly
// @desc    Historical trends grouped implicitly by Month/Year
router.get('/monthly', getMonthlyTrends);

// @route   GET /api/analytics/daily-weekly
// @desc    Breakdown aggregated strictly per days/week historically (30d limit)
router.get('/daily-weekly', getDailyWeeklyStats);

module.exports = router;
