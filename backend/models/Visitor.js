const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true
  },
  company: {
    type: String,
    default: 'Independent'
  },
  idProofType: {
    type: String,
    enum: ['Aadhaar', 'PAN', 'Passport', 'Driving License', 'Voter ID', 'Other'],
    default: 'Aadhaar'
  },
  idProofNumber: {
    type: String,
    default: ''
  },
  photoUrl: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Visitor', visitorSchema);
