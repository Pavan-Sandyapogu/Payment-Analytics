const express = require('express');
const router = express.Router();
const { getTransactions } = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/transactions
// @desc    Get all user transactions (with filters)
// @access  Private
router.get('/', protect, getTransactions);

module.exports = router;
