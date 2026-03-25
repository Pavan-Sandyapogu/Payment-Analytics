const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const { createPaymentOrder, verifyPaymentOrder } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// @route   POST /api/payments/order
// @desc    Create Razorpay Order securely checking constraints natively
// @access  Private
router.post(
  '/order', 
  protect,
  [
    body('amount', 'Standard numeric amount gracefully required.').isFloat({ gt: 0 }),
  ],
  validateRequest,
  createPaymentOrder
);

// @route   POST /api/payments/verify
// @desc    Verify Razorpay Payment logic seamlessly
// @access  Private
router.post(
  '/verify', 
  protect,
  [
    body('razorpay_order_id', 'Order ID is strictly mapped globally').trim().not().isEmpty(),
    body('razorpay_payment_id', 'Payment ID relies upon dynamic tracking').trim().not().isEmpty(),
    body('razorpay_signature', 'Valid explicit signature expected globally').trim().not().isEmpty(),
    body('amount', 'Payment mapping ensures amount integrity globally').isFloat({ gt: 0 })
  ],
  validateRequest,
  verifyPaymentOrder
);

module.exports = router;
