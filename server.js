require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const healthRoutes = require('./routes/healthRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
connectDB();

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

// Temporary test route
app.get('/api/test-key', (req, res) => {
  res.json({ success: true, key: process.env.RAZORPAY_KEY_ID });
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'frontend', 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'frontend', 'dist', 'index.html'));
  });
}

// Error Handler Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
