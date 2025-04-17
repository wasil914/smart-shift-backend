const express = require('express');
const router = express.Router();
const ShiftConfig = require('../models/ShiftConfig');
const authMiddleware = require('../middleware/auth'); // ensure this exists
const requireRole = require('../middleware/requireRole'); // ensure this exists

// ✅ GET current config (admin only)
router.get('/', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const config = await ShiftConfig.findOne();
    res.json(config || { minEmployeesPerShift: 1, maxEmployeesPerShift: 3 });
  } catch (err) {
    console.error('Error fetching config:', err.message);
    res.status(500).json({ message: 'Failed to fetch config' });
  }
});

// ✅ POST/PUT update config (admin only)
router.post('/', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { minEmployeesPerShift, maxEmployeesPerShift } = req.body;

    let config = await ShiftConfig.findOne();

    if (config) {
      config.minEmployeesPerShift = minEmployeesPerShift;
      config.maxEmployeesPerShift = maxEmployeesPerShift;
      await config.save();
    } else {
      config = await ShiftConfig.create({ minEmployeesPerShift, maxEmployeesPerShift });
    }

    res.json({ message: 'Shift config updated successfully', config });
  } catch (err) {
    console.error('Error updating config:', err.message);
    res.status(500).json({ message: 'Failed to update config' });
  }
});

module.exports = router;
