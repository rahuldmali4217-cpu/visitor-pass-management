const express = require('express');
const router = express.Router();
const {
  createAppointment,
  getAppointments,
  updateAppointmentStatus
} = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public Pre-Registration can create an appointment request
router.post('/public-register', createAppointment);

// Protected routes
router.post('/', protect, createAppointment);
router.get('/', protect, getAppointments);
router.put('/:id/status', protect, authorize('Host', 'Admin'), updateAppointmentStatus);

module.exports = router;
