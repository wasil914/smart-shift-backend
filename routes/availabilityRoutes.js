

// module.exports = router;
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Availability = require('../models/Availability');
const { generateWeeklySchedule } = require('../services/scheduler');

// 🔐 Auth middleware
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// ✅ Save/Update availability
router.post('/', authMiddleware, async (req, res) => {
  const { preferredShifts, maxHoursPerWeek, daysOff } = req.body;

  try {
    // 📌 Validate input format
    if (!Array.isArray(preferredShifts) || preferredShifts.length === 0) {
      return res.status(400).json({ message: 'preferredShifts must be a non-empty array.' });
    }

    if (typeof maxHoursPerWeek !== 'number' || maxHoursPerWeek < 10 || maxHoursPerWeek > 60) {
      return res.status(400).json({ message: 'maxHoursPerWeek must be a number between 10 and 60.' });
    }

    if (!Array.isArray(daysOff)) {
      return res.status(400).json({ message: 'daysOff must be an array.' });
    }

    let availability = await Availability.findOne({ user: req.user.id });

    const newData = {
      preferredShifts,
      maxHoursPerWeek,
      daysOff
    };

    let shouldRecalculate = false;

    if (availability) {
      // 🧠 Compare existing and new values
      const isDifferent =
        JSON.stringify([...availability.preferredShifts].sort()) !== JSON.stringify([...preferredShifts].sort()) ||
        availability.maxHoursPerWeek !== maxHoursPerWeek ||
        JSON.stringify([...availability.daysOff].sort()) !== JSON.stringify([...daysOff].sort());

      if (isDifferent) {
        availability.preferredShifts = preferredShifts;
        availability.maxHoursPerWeek = maxHoursPerWeek;
        availability.daysOff = daysOff;
        await availability.save();
        shouldRecalculate = true;
      }
    } else {
      availability = new Availability({
        user: req.user.id,
        ...newData
      });
      await availability.save();
      shouldRecalculate = true;
    }

    // 🔁 Trigger scheduler only if availability changed
    if (shouldRecalculate) {
      try {
        await generateWeeklySchedule();
        console.log(`🔁 Scheduler triggered for user ${req.user.id}`);
      } catch (schedulerErr) {
        console.error('❌ Scheduler error:', schedulerErr);
      }
    } else {
      console.log(`✅ No change in availability. Skipping scheduler.`);
    }

    res.status(201).json({
      message: 'Availability saved',
      availability
    });

  } catch (err) {
    console.error('💥 Availability Error:', err.message, err.stack);
    res.status(500).json({
      message: 'Failed to save availability',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router;
