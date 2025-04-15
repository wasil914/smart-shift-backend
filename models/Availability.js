const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

  preferredShifts: {
    type: [String],
    enum: ['morning', 'afternoon', 'night'],
    required: true
  },

  maxHoursPerWeek: {
    type: Number,
    min: 10,
    max: 60,
    required: true
  },

  daysOff: {
    type: [String],
    enum: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model('Availability', availabilitySchema);
