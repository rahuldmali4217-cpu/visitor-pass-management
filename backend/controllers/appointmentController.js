const jwt = require('jsonwebtoken');
const Appointment = require('../models/Appointment');
const Pass = require('../models/Pass');
const User = require('../models/User');
const Otp = require('../models/Otp');
const { generatePassPDFBuffer } = require('../utils/pdfGenerator');
const { sendEmail, sendPassIssuedEmail } = require('../utils/emailSender');
const { sendSMS } = require('../utils/smsSender');

const getJwtSecret = () => process.env.JWT_SECRET || 'visitor_pass_default_jwt_secret_key_2026';

// Generate unique pass code with format VP-XXXXXX
const generatePassCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'VP-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * @desc    Create new Appointment (Visitor Pre-Registration or Host Invitation)
 * @route   POST /api/appointments OR POST /api/appointments/public-register
 * @access  Public (with verified OTP) / Private (Host / Admin)
 */
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

    // Validate required fields
    if (!visitorName || !visitorEmail || !visitorPhone || !hostId || !purpose || !scheduledStartTime || !scheduledEndTime) {
      return res.status(400).json({ success: false, message: 'All visitor and appointment fields are required' });
    }

    const normalizedEmail = visitorEmail.toLowerCase().trim();

    // Verify host exists and has Host or Admin role
    const hostUser = await User.findById(hostId);
    if (!hostUser || (hostUser.role !== 'Host' && hostUser.role !== 'Admin')) {
      return res.status(400).json({ success: false, message: 'Selected host is invalid or not available' });
    }

    const isHostCreating = req.user && (req.user.role === 'Host' || req.user.role === 'Admin');

    // If submitted via public pre-registration, ensure OTP was verified
    if (!isHostCreating) {
      let otpVerified = false;

      if (verificationToken) {
        try {
          const decoded = jwt.verify(verificationToken, getJwtSecret());
          if (decoded.email === normalizedEmail) {
            otpVerified = true;
          }
        } catch (tokenErr) {
          // Token invalid or expired
        }
      }

      // Check DB for recent verified OTP if token verification didn't match
      if (!otpVerified) {
        const verifiedRecord = await Otp.findOne({
          email: normalizedEmail,
          verified: true
        }).sort({ createdAt: -1 });

        if (verifiedRecord) {
          otpVerified = true;
          // Consume the OTP so it cannot be reused
          await Otp.deleteOne({ _id: verifiedRecord._id });
        }
      }

      if (!otpVerified && process.env.NODE_ENV === 'production') {
        return res.status(400).json({
          success: false,
          message: 'OTP verification required before submitting pre-registration.'
        });
      }
    }

    const status = isHostCreating ? 'APPROVED' : 'PENDING';

    const appointment = await Appointment.create({
      visitor: {
        name: visitorName,
        email: normalizedEmail,
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
      requestedBy: requestedBy || (isHostCreating ? 'HOST' : 'VISITOR')
    });

    let pass = null;

    // If host is inviting directly, auto-issue active pass and generate PDF
    if (status === 'APPROVED') {
      const passCode = generatePassCode();

      pass = await Pass.create({
        passCode,
        appointment: appointment._id,
        visitorName,
        visitorEmail: normalizedEmail,
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

      // Generate PDF badge buffer for email attachment
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
          toEmail: normalizedEmail,
          visitorName,
          passCode,
          validFrom: scheduledStartTime,
          validUntil: scheduledEndTime,
          hostName: hostUser.name,
          pdfBuffer
        });
      } catch (emailErr) {
        console.error('Email sending failed on host invitation:', emailErr.message);
      }
    } else {
      // Send confirmation email to visitor and notification to host
      sendEmail({
        to: normalizedEmail,
        subject: `Visit Request Submitted - Pending Approval by ${hostUser.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 580px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h3 style="color: #0f172a;">Pre-Registration Submitted 📋</h3>
            <p>Hello <strong>${visitorName}</strong>,</p>
            <p>Your visit request to meet <strong>${hostUser.name} (${hostUser.department})</strong> has been received and is pending approval.</p>
            <p><strong>Scheduled:</strong> ${new Date(scheduledStartTime).toLocaleString()} - ${new Date(scheduledEndTime).toLocaleString()}</p>
            <p><strong>Purpose:</strong> ${purpose}</p>
            <p style="color: #64748b; font-size: 13px;">You will receive an email with your Digital QR Pass once approved.</p>
          </div>
        `
      });

      // Notify Host about the new visitor request
      sendEmail({
        to: hostUser.email,
        subject: `New Visitor Request from ${visitorName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 580px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h3 style="color: #0f172a;">New Visit Request Alert 🔔</h3>
            <p>Hello <strong>${hostUser.name}</strong>,</p>
            <p><strong>${visitorName}</strong> from <em>${visitorCompany || 'Independent'}</em> has requested an appointment with you.</p>
            <p><strong>Purpose:</strong> ${purpose}</p>
            <p><strong>Time:</strong> ${new Date(scheduledStartTime).toLocaleString()}</p>
            <p>Please log in to your Host Dashboard to approve or reject this request.</p>
          </div>
        `
      });
    }

    res.status(201).json({
      success: true,
      message: status === 'APPROVED' ? 'Pass issued successfully' : 'Pre-registration submitted successfully',
      data: {
        appointment,
        pass
      }
    });
  } catch (error) {
    console.error('Error in createAppointment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get Appointments list (Role-filtered)
 * @route   GET /api/appointments
 * @access  Private
 */
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

/**
 * @desc    Approve or Reject visit request by Host/Admin
 * @route   PUT /api/appointments/:id/status
 * @access  Private (Host / Admin)
 */
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

    // Role check: Only the designated host or an Admin can approve
    if (req.user.role === 'Host' && appointment.host._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized: You are not the assigned host for this appointment' });
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

      // Generate PDF badge and email to visitor
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
        console.error('Failed to attach PDF badge to approval email:', err.message);
      }
    } else {
      // Rejection email
      sendEmail({
        to: appointment.visitor.email,
        subject: `Visit Request Declined: ${appointment.visitor.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 580px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h3 style="color: #dc2626;">Visit Request Declined ❌</h3>
            <p>Hello <strong>${appointment.visitor.name}</strong>,</p>
            <p>Your visit request to meet <strong>${appointment.host.name}</strong> has been declined.</p>
            ${remarks ? `<p><strong>Reason / Remarks:</strong> ${remarks}</p>` : ''}
            <p style="color: #64748b; font-size: 13px;">Please contact your host directly for further information.</p>
          </div>
        `
      });
    }

    res.json({
      success: true,
      message: `Appointment ${status.toLowerCase()} successfully`,
      data: {
        appointment,
        pass
      }
    });
  } catch (error) {
    console.error('Error in updateAppointmentStatus:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createAppointment,
  getAppointments,
  updateAppointmentStatus
};
