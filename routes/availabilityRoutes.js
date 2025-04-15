const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Availability = require('../models/Availability');

// Auth middleware to extract user from JWT
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ message: 'Unauthorized' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// POST/PUT availability
router.post('/', authMiddleware, async (req, res) => {
  const { preferredShifts, maxHoursPerWeek, daysOff } = req.body;

  try {
    const existing = await Availability.findOne({ user: req.user.id });
    if (existing) {
      existing.preferredShifts = preferredShifts;
      existing.maxHoursPerWeek = maxHoursPerWeek;
      existing.daysOff = daysOff;
      await existing.save();
      return res.json({ message: 'Availability updated', availability: existing });
    }

    const newAvailability = new Availability({
      user: req.user.id,
      preferredShifts,
      maxHoursPerWeek,
      daysOff
    });

    await newAvailability.save();
    res.status(201).json({ message: 'Availability saved', availability: newAvailability });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to save availability' });
  }
});

module.exports = router;
