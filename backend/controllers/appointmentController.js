const jwt = require('jsonwebtoken');
const Appointment = require('../models/Appointment');
const Pass = require('../models/Pass');
const User = require('../models/User');
const Otp = require('../models/Otp');
const { generatePassPDFBuffer } = require('../utils/pdfGenerator');
const { sendEmail, sendPassIssuedEmail } = require('../utils/emailSender');

const getJwtSecret = () => process.env.JWT_SECRET || 'visitor_pass_jwt_secret_2026';

// helper to generate unique pass code
const generatePassCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'VP-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// 1. create appointment (visitor pre-register or host direct invite)
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
      requestedBy,
      verificationToken
    } = req.body;

    if (!visitorName || !visitorEmail || !visitorPhone || !hostId || !purpose || !scheduledStartTime || !scheduledEndTime) {
      return res.status(400).json({ success: false, message: 'All required fields must be filled' });
    }

    const cleanEmail = visitorEmail.toLowerCase().trim();

    // find host in database
    const hostUser = await User.findById(hostId);
    if (!hostUser || (hostUser.role !== 'Host' && hostUser.role !== 'Admin')) {
      return res.status(400).json({ success: false, message: 'Selected host is invalid' });
    }

    const isHost = req.user && (req.user.role === 'Host' || req.user.role === 'Admin');

    // verify otp for public pre-registration
    if (!isHost) {
      let isVerified = false;

      if (verificationToken) {
        try {
          const decoded = jwt.verify(verificationToken, getJwtSecret());
          if (decoded.email === cleanEmail) {
            isVerified = true;
          }
        } catch (e) {}
      }

      if (!isVerified) {
        const verifiedOtp = await Otp.findOne({ email: cleanEmail, verified: true }).sort({ createdAt: -1 });
        if (verifiedOtp) {
          isVerified = true;
          await Otp.deleteOne({ _id: verifiedOtp._id });
        }
      }

      if (!isVerified && process.env.NODE_ENV === 'production') {
        return res.status(400).json({ success: false, message: 'Please verify your OTP before submitting' });
      }
    }

    const status = isHost ? 'APPROVED' : 'PENDING';

    const appointment = await Appointment.create({
      visitor: {
        name: visitorName,
        email: cleanEmail,
        phone: visitorPhone,
        company: visitorCompany || 'Independent',
        idProofType: idProofType || 'Aadhaar',
        idProofNumber: idProofNumber || ''
      },
      host: hostId,
      purpose,
      scheduledStartTime: new Date(scheduledStartTime),
      scheduledEndTime: new Date(scheduledEndTime),
      status,
      requestedBy: requestedBy || (isHost ? 'HOST' : 'VISITOR')
    });

    let pass = null;

    // if host invites directly, automatically create pass and email pdf badge
    if (status === 'APPROVED') {
      const passCode = generatePassCode();

      pass = await Pass.create({
        passCode,
        appointment: appointment._id,
        visitorName,
        visitorEmail: cleanEmail,
        visitorPhone,
        visitorCompany: visitorCompany || 'Independent',
        host: hostId,
        purpose,
        validFrom: new Date(scheduledStartTime),
        validUntil: new Date(scheduledEndTime),
        status: 'ACTIVE',
        qrCodeData: passCode,
        createdBy: req.user ? req.user._id : hostId
      });

      // generate pdf and send email
      try {
        const pdfBuffer = await generatePassPDFBuffer({
          passCode,
          visitorName,
          visitorCompany: visitorCompany || 'Independent',
          hostName: hostUser.name,
          purpose,
          validFrom: new Date(scheduledStartTime),
          validUntil: new Date(scheduledEndTime)
        });

        await sendPassIssuedEmail({
          toEmail: cleanEmail,
          visitorName,
          passCode,
          validFrom: scheduledStartTime,
          validUntil: scheduledEndTime,
          hostName: hostUser.name,
          pdfBuffer
        });
      } catch (err) {
        console.error('Email sending error:', err.message);
      }
    } else {
      // send pending notification to visitor and host
      sendEmail({
        to: cleanEmail,
        subject: `Visit Request Submitted - Pending Approval`,
        html: `<h3>Hello ${visitorName},</h3><p>Your request to visit <b>${hostUser.name}</b> has been received and is waiting for approval.</p>`
      });

      sendEmail({
        to: hostUser.email,
        subject: `New Visitor Request from ${visitorName}`,
        html: `<h3>Hello ${hostUser.name},</h3><p><b>${visitorName}</b> has requested a visit appointment for: <i>${purpose}</i>. Please login to approve or reject.</p>`
      });
    }

    res.status(201).json({
      success: true,
      message: status === 'APPROVED' ? 'Pass issued successfully' : 'Pre-registration submitted successfully',
      data: { appointment, pass }
    });
  } catch (error) {
    console.error('Error in createAppointment:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. get appointments list for current user role
const getAppointments = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'Host') {
      filter.host = req.user._id;
    } else if (req.user.role === 'Visitor') {
      filter['visitor.email'] = req.user.email.toLowerCase();
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

// 3. host approves or rejects visit request
const updateAppointmentStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be APPROVED or REJECTED' });
    }

    const appointment = await Appointment.findById(req.params.id).populate('host', 'name email department');
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // only assigned host or admin can update status
    if (req.user.role === 'Host' && appointment.host._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized for this appointment' });
    }

    appointment.status = status;
    if (remarks) appointment.remarks = remarks;
    await appointment.save();

    let pass = null;

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

      // send pass email with pdf badge
      try {
        const pdfBuffer = await generatePassPDFBuffer({
          passCode: pass.passCode,
          visitorName: pass.visitorName,
          visitorCompany: pass.visitorCompany,
          hostName: appointment.host.name,
          purpose: pass.purpose,
          validFrom: pass.validFrom,
          validUntil: pass.validUntil
        });

        await sendPassIssuedEmail({
          toEmail: appointment.visitor.email,
          visitorName: appointment.visitor.name,
          passCode: pass.passCode,
          validFrom: pass.validFrom,
          validUntil: pass.validUntil,
          hostName: appointment.host.name,
          pdfBuffer
        });
      } catch (err) {
        console.error('PDF email error:', err.message);
      }
    } else {
      // rejection email
      sendEmail({
        to: appointment.visitor.email,
        subject: `Visit Request Update: ${appointment.visitor.name}`,
        html: `<h3>Hello ${appointment.visitor.name},</h3><p>Your visit request to meet <b>${appointment.host.name}</b> was not approved.</p>`
      });
    }

    res.json({
      success: true,
      message: `Appointment ${status.toLowerCase()} successfully`,
      data: { appointment, pass }
    });
  } catch (error) {
    console.error('Error in updateAppointmentStatus:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createAppointment,
  getAppointments,
  updateAppointmentStatus
};
