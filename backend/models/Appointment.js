const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  visitor: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    company: { type: String, default: 'Self' },
    idProofType: { type: String, default: 'Aadhaar' },
    idProofNumber: { type: String, default: '' },
    photoUrl: { type: String, default: '' }
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
  scheduledStartTime: {
    type: Date,
    required: true
  },
  scheduledEndTime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED'],
    default: 'PENDING'
  },
  remarks: {
    type: String,
    default: ''
  },
  requestedBy: {
    type: String,
    enum: ['HOST', 'VISITOR'],
    default: 'VISITOR'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Appointment', appointmentSchema);
