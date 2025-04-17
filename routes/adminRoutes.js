

const express = require('express');
const router = express.Router();
const ShiftConfig = require('../models/ShiftConfig');
const jwt = require('jsonwebtoken');

// Admin middleware (basic)
const adminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ message: 'Unauthorized' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Admins only' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Get current config
router.get('/shift-config', adminAuth, async (req, res) => {
  let config = await ShiftConfig.findOne();
  if (!config) {
    config = new ShiftConfig(); // insert default
    await config.save();
  }
  res.json(config);
});

// Update config
router.put('/shift-config', adminAuth, async (req, res) => {
  const { minEmployeesPerShift, maxEmployeesPerShift } = req.body;

  try {
    let config = await ShiftConfig.findOne();
    if (!config) config = new ShiftConfig();

    config.minEmployeesPerShift = minEmployeesPerShift;
    config.maxEmployeesPerShift = maxEmployeesPerShift;

    await config.save();
    res.json({ message: 'Shift config updated', config });
  } catch (err) {
    res.status(500).json({ message: 'Error updating config', error: err.message });
  }
});

module.exports = router;
