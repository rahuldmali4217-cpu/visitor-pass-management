const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  otpCode: {
    type: String,
    required: true
  },
  purpose: {
    type: String,
    enum: ['PRE_REGISTRATION', 'PASSWORD_RESET', 'LOGIN_VERIFICATION'],
    default: 'PRE_REGISTRATION'
  },
  verified: {
    type: Boolean,
    default: false
  },
  attempts: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600 // Auto-delete document from MongoDB after 10 minutes (TTL index)
  }
});

module.exports = mongoose.model('Otp', otpSchema);
