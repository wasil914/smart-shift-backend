const mongoose = require('mongoose');

const shiftConfigSchema = new mongoose.Schema({
  minEmployeesPerShift: {
    type: Number,
    default: 1
  },
  maxEmployeesPerShift: {
    type: Number,
    default: 3
  }
});

module.exports = mongoose.model('ShiftConfig', shiftConfigSchema);
