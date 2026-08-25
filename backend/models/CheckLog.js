const mongoose = require('mongoose');

const checkLogSchema = new mongoose.Schema({
  pass: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pass',
    required: true
  },
  passCode: {
    type: String,
    required: true
  },
  visitorName: {
    type: String,
    required: true
  },
  hostName: {
    type: String,
    required: true
  },
  checkInTime: {
    type: Date,
    default: Date.now
  },
  checkOutTime: {
    type: Date,
    default: null
  },
  checkedInBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  checkedOutBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['CHECKED_IN', 'CHECKED_OUT'],
    default: 'CHECKED_IN'
  },
  remarks: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CheckLog', checkLogSchema);
