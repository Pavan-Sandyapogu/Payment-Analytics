const Razorpay = require('razorpay');
const crypto = require('crypto');

// Create Razorpay instance using environment variables
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Creates a new Razorpay order
 * @param {number} amount - Amount in standard currency (e.g., INR) NOT in paise
 * @param {string} currency - Currency code (Default: 'INR')
 * @param {string} receipt - Receipt identifier string
 * @returns {Promise<Object>} Razorpay Order Object
 */
const createOrder = async (amount, currency = 'INR', receipt) => {
  const options = {
    amount: amount * 100, // Razorpay converts to paise
    currency,
    receipt,
  };

  try {
    const order = await razorpayInstance.orders.create(options);
    return order;
  } catch (error) {
    throw new Error(`Razorpay Order Creation Failed: ${error.message}`);
  }
};

/**
 * Verifies Razorpay payment signature
 * @param {string} order_id
 * @param {string} payment_id
 * @param {string} signature
 * @returns {boolean} True if signature is valid
 */
const verifyPaymentSignature = (order_id, payment_id, signature) => {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new Error('Razorpay secret key not configured');
  
  const generated_signature = crypto
    .createHmac('sha256', secret)
    .update(`${order_id}|${payment_id}`)
    .digest('hex');

  return generated_signature === signature;
};

module.exports = {
  createOrder,
  verifyPaymentSignature,
};
