const express = require('express');
const router = express.Router();
const requireRole = require('../middleware/requireRole');
const User = require('../models/User');

// Admin-only: Update another user's role and/or seniority
router.put('/update-user/:id', requireRole('admin'), async (req, res) => {
  try {
    const { role, seniority } = req.body;

    const updatedFields = {};
    if (role) updatedFields.role = role;
    if (seniority) updatedFields.seniority = seniority;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updatedFields },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        seniority: user.seniority
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

module.exports = router;
