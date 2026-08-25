const mongoose = require('mongoose');

const passSchema = new mongoose.Schema({
  passCode: {
    type: String,
    required: true,
    unique: true
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    default: null
  },
  visitorName: {
    type: String,
    required: true
  },
  visitorEmail: {
    type: String,
    required: true
  },
  visitorPhone: {
    type: String,
    required: true
  },
  visitorCompany: {
    type: String,
    default: 'N/A'
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  purpose: {
    type: String,
    required: true
  },
  validFrom: {
    type: Date,
    required: true
  },
  validUntil: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'EXPIRED', 'USED', 'REVOKED'],
    default: 'ACTIVE'
  },
  qrCodeData: {
    type: String,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Pass', passSchema);
