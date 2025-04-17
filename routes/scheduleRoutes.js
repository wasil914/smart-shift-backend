

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth'); // JWT middleware
const requireRole = require('../middleware/requireRole');
const { generateWeeklySchedule } = require('../services/scheduler');
const Shift = require('../models/Shift');

// ✅ Admin triggers generation
router.post('/generate', requireRole('admin'), async (req, res) => {
  try {
    const schedule = await generateWeeklySchedule();
    res.status(200).json({ message: 'Schedule generated', schedule });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error generating schedule' });
  }
});

// ✅ Authenticated users fetch shifts
router.get('/', authMiddleware, async (req, res) => {
  try {
    let shifts;

    if (req.user.role === 'admin') {
      // 👑 Admin sees all shifts
      shifts = await Shift.find().populate('assignedEmployees', 'name seniority');
    } else {
      // 👤 Employee sees only their own shifts
      shifts = await Shift.find({ assignedEmployees: req.user.id }).populate(
        'assignedEmployees',
        'name seniority'
      );
    }

    res.json(shifts);
  } catch (err) {
    console.error('Failed to fetch shifts:', err);
    res.status(500).json({ message: 'Failed to fetch shifts' });
  }
});

module.exports = router;

