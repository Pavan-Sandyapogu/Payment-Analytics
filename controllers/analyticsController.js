const Transaction = require('../models/transactionModel');
const mongoose = require('mongoose');

// @desc    Get total spending
// @route   GET /api/analytics/total
// @access  Private
const getTotalSpending = async (req, res) => {
  try {
    const total = await Transaction.aggregate([
      { $match: { user_id: req.user._id, status: 'success' } },
      { $group: { _id: null, totalAmount: { $sum: '$amount' } } }
    ]);

    res.status(200).json({
      success: true,
      totalSpending: total.length > 0 ? total[0].totalAmount : 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get category breakdown
// @route   GET /api/analytics/category
// @access  Private
const getCategoryBreakdown = async (req, res) => {
  try {
    const breakdown = await Transaction.aggregate([
      { $match: { user_id: req.user._id, status: 'success' } },
      { 
        $group: { 
          _id: '$category', 
          totalAmount: { $sum: '$amount' }, 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { totalAmount: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: breakdown
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get monthly trends
// @route   GET /api/analytics/monthly
// @access  Private
const getMonthlyTrends = async (req, res) => {
  try {
    const trends = await Transaction.aggregate([
      { $match: { user_id: req.user._id, status: 'success' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: trends
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get daily/weekly stats
// @route   GET /api/analytics/daily-weekly
// @access  Private
const getDailyWeeklyStats = async (req, res) => {
  try {
    // Generate limit for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const stats = await Transaction.aggregate([
      { 
        $match: { 
          user_id: req.user._id, 
          status: 'success',
          createdAt: { $gte: thirtyDaysAgo }
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            week: { $isoWeek: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTotalSpending,
  getCategoryBreakdown,
  getMonthlyTrends,
  getDailyWeeklyStats
};
