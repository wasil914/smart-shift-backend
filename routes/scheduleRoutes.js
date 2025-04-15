const express = require('express');
const router = express.Router();
const requireRole = require('../middleware/requireRole');
const { generateWeeklySchedule } = require('../services/scheduler');
const Shift = require('../models/Shift');

// Admin triggers schedule generation
router.post('/generate', requireRole('admin'), async (req, res) => {
  try {
    const schedule = await generateWeeklySchedule();
    res.status(200).json({ message: 'Schedule generated', schedule });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error generating schedule' });
  }
});

// Anyone (employee/admin) can fetch it
router.get('/', async (req, res) => {
  try {
    const shifts = await Shift.find().populate('assignedEmployees', 'name email seniority');
    res.json(shifts);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch shifts' });
  }
});

module.exports = router;
