const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['employee', 'admin'],
    default: 'employee'
  },
  seniority: {
    type: String,
    enum: ['junior', 'mid', 'senior'],
    default: 'junior'
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
