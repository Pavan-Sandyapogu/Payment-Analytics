const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');

// Helper to consolidate validation checking flexibly
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// @route   POST /api/auth/register
// @desc    Register a new user dynamically mapping dependencies explicitly
// @access  Public
router.post(
  '/register',
  [
    body('name', 'Name is required').trim().not().isEmpty(),
    body('email', 'Please include a valid structural email').isEmail().normalizeEmail(),
    body('password', 'Password must be exactly 6 or more complex characters').isLength({ min: 6 })
  ],
  validateRequest,
  registerUser
);

// @route   POST /api/auth/login
// @desc    Authenticate existing user securely
// @access  Public
router.post(
  '/login',
  [
    body('email', 'Please include a valid email framework').isEmail().normalizeEmail(),
    body('password', 'Password verification parameters required').exists()
  ],
  validateRequest,
  loginUser
);

module.exports = router;
