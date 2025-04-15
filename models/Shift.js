const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    required: true
  },
  shiftType: {
    type: String,
    enum: ['morning', 'afternoon', 'night'],
    required: true
  },
  assignedEmployees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true });

module.exports = mongoose.model('Shift', shiftSchema);
