const Appointment = require('../models/Appointment');
const Pass = require('../models/Pass');
const User = require('../models/User');
const { generateQRCode } = require('../utils/qrGenerator');
const { sendEmail } = require('../utils/emailSender');

// Helper to generate unique pass code
const generatePassCode = () => {
  return 'VP-' + Math.random().toString(36).substr(2, 6).toUpperCase();
};

// @desc    Create new Appointment (Host invites visitor or Visitor pre-registers)
// @route   POST /api/appointments
// @access  Public / Private
const createAppointment = async (req, res) => {
  try {
    const {
      visitorName,
      visitorEmail,
      visitorPhone,
      visitorCompany,
      idProofType,
      idProofNumber,
      hostId,
      purpose,
      scheduledStartTime,
      scheduledEndTime,
      requestedBy
    } = req.body;

    if (!visitorName || !visitorEmail || !visitorPhone || !hostId || !purpose || !scheduledStartTime || !scheduledEndTime) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const hostUser = await User.findById(hostId);
    if (!hostUser || (hostUser.role !== 'Host' && hostUser.role !== 'Admin')) {
      return res.status(400).json({ success: false, message: 'Invalid host selected' });
    }

    // Auto-approve if host creates the invitation
    const isHostCreating = req.user && (req.user.role === 'Host' || req.user.role === 'Admin');
    const status = isHostCreating ? 'APPROVED' : 'PENDING';

    const appointment = await Appointment.create({
      visitor: {
        name: visitorName,
        email: visitorEmail,
        phone: visitorPhone,
        company: visitorCompany || 'Independent',
        idProofType: idProofType || 'Aadhaar',
        idProofNumber: idProofNumber || ''
      },
      host: hostId,
      purpose,
      scheduledStartTime,
      scheduledEndTime,
      status,
      requestedBy: requestedBy || (isHostCreating ? 'HOST' : 'VISITOR')
    });

    // If auto-approved, auto-create Pass
    let pass = null;
    if (status === 'APPROVED') {
      const passCode = generatePassCode();
      const qrCodeData = passCode;

      pass = await Pass.create({
        passCode,
        appointment: appointment._id,
        visitorName,
        visitorEmail,
        visitorPhone,
        visitorCompany: visitorCompany || 'Independent',
        host: hostId,
        purpose,
        validFrom: scheduledStartTime,
        validUntil: scheduledEndTime,
        status: 'ACTIVE',
        qrCodeData,
        createdBy: req.user ? req.user._id : hostId
      });
    }

    // Notify Visitor
    sendEmail({
      to: visitorEmail,
      subject: `Visitor Pass Request (${status}) - ${visitorName}`,
      html: `<h3>Hello ${visitorName},</h3>
             <p>Your visit appointment with <b>${hostUser.name}</b> has been <b>${status}</b>.</p>
             <p><b>Purpose:</b> ${purpose}</p>
             <p><b>Date & Time:</b> ${new Date(scheduledStartTime).toLocaleString()} to ${new Date(scheduledEndTime).toLocaleString()}</p>
             ${pass ? `<p><b>Pass Code:</b> ${pass.passCode}</p>` : '<p>Status is PENDING host approval.</p>'}`
    });

    res.status(201).json({
      success: true,
      data: {
        appointment,
        pass
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Appointments (Filtered by role: Host sees their own, Admin/Security see all)
// @route   GET /api/appointments
// @access  Private
const getAppointments = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'Host') {
      filter.host = req.user._id;
    } else if (req.user.role === 'Visitor') {
      filter['visitor.email'] = req.user.email;
    }

    const appointments = await Appointment.find(filter)
      .populate('host', 'name email department phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Appointment Status (Approve / Reject)
// @route   PUT /api/appointments/:id/status
// @access  Private (Host/Admin)
const updateAppointmentStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const appointment = await Appointment.findById(req.params.id).populate('host', 'name email');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (req.user.role === 'Host' && appointment.host._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to manage this appointment' });
    }

    appointment.status = status;
    if (remarks) appointment.remarks = remarks;
    await appointment.save();

    let pass = null;

    // If APPROVED, create digital pass if not already existing
    if (status === 'APPROVED') {
      let existingPass = await Pass.findOne({ appointment: appointment._id });
      if (!existingPass) {
        const passCode = generatePassCode();
        pass = await Pass.create({
          passCode,
          appointment: appointment._id,
          visitorName: appointment.visitor.name,
          visitorEmail: appointment.visitor.email,
          visitorPhone: appointment.visitor.phone,
          visitorCompany: appointment.visitor.company,
          host: appointment.host._id,
          purpose: appointment.purpose,
          validFrom: appointment.scheduledStartTime,
          validUntil: appointment.scheduledEndTime,
          status: 'ACTIVE',
          qrCodeData: passCode,
          createdBy: req.user._id
        });
      } else {
        pass = existingPass;
      }
    }

    // Send Notification Email
    sendEmail({
      to: appointment.visitor.email,
      subject: `Visitor Pass ${status} - ${appointment.visitor.name}`,
      html: `<h3>Hello ${appointment.visitor.name},</h3>
             <p>Your appointment with <b>${appointment.host.name}</b> is now <b>${status}</b>.</p>
             ${pass ? `<p>Your Pass Code is: <b>${pass.passCode}</b></p>` : ''}`
    });

    res.json({
      success: true,
      data: {
        appointment,
        pass
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createAppointment,
  getAppointments,
  updateAppointmentStatus
};
