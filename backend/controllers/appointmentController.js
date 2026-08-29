// ==========================================
// Appointment & Visit Request Controller
// ==========================================
const jwt = require('jsonwebtoken');
const Appointment = require('../models/Appointment');
const Pass = require('../models/Pass');
const User = require('../models/User');
const Otp = require('../models/Otp');
const { generatePassPDFBuffer } = require('../utils/pdfGenerator');
const { sendEmail, sendPassIssuedEmail } = require('../utils/emailSender');

const getJwtSecret = () => process.env.JWT_SECRET || 'visitor_pass_jwt_secret_2026';

// Unique 6-character Pass Code generate karne ka helper (e.g. VP-AB12CD)
const generatePassCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'VP-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// 1. Visitor Pre-registration ya Host direct appointment create karna
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
      return res.status(400).json({ success: false, message: 'Sabhi fields bharna zaroori hai' });
    }

    const cleanEmail = visitorEmail.toLowerCase().trim();

    // Host user database me exist karta hai ya nahi check karna
    const hostUser = await User.findById(hostId);
    if (!hostUser || (hostUser.role !== 'Host' && hostUser.role !== 'Admin')) {
      return res.status(400).json({ success: false, message: 'Chuna gaya Host valid nahi hai' });
    }

    const isHost = req.user && (req.user.role === 'Host' || req.user.role === 'Admin');

    // Public visitor submission ke liye OTP verification token check karna
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
        return res.status(400).json({ success: false, message: 'Kripya pehle apna OTP verify karein' });
      }
    }

    // Host direct banaye toh status APPROVED, visitor banaye toh PENDING
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

    // Agar appointment APPROVED hai toh turant digital pass aur PDF badge generate karna
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

      // PDF badge buffer banakar email par attach karke bhejna
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
        console.error('Email send error:', err.message);
      }
    } else {
      // Pending request ka email visitor aur host dono ko bhejna
      sendEmail({
        to: cleanEmail,
        subject: `Visit Request Submitted - Pending Approval by ${hostUser.name}`,
        html: `<h3>Namaste ${visitorName},</h3><p>Aapki visit request Host <b>${hostUser.name}</b> ke paas review ke liye bhej di gayi hai.</p>`
      });

      sendEmail({
        to: hostUser.email,
        subject: `New Visitor Request from ${visitorName}`,
        html: `<h3>Namaste ${hostUser.name},</h3><p><b>${visitorName}</b> ne meeting ke liye request submit ki hai: <i>${purpose}</i>. Approve karne ke liye login karein.</p>`
      });
    }

    res.status(201).json({
      success: true,
      message: status === 'APPROVED' ? 'Pass successfully issue ho gaya' : 'Pre-registration request submit ho gayi',
      data: { appointment, pass }
    });
  } catch (error) {
    console.error('createAppointment error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Role ke hisab se appointments ki list nikalna
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

// 3. Host dwara visit request ko Approve ya Reject karna
const updateAppointmentStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status APPROVED ya REJECTED hona chahiye' });
    }

    const appointment = await Appointment.findById(req.params.id).populate('host', 'name email department');
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment record nahi mila' });
    }

    // Sirf wahi host update kar sakta hai jiske liye request aayi thi
    if (req.user.role === 'Host' && appointment.host._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Aapko is request ko update karne ki permission nahi hai' });
    }

    appointment.status = status;
    if (remarks) appointment.remarks = remarks;
    await appointment.save();

    let pass = null;

    // Approve hone par Digital Pass issue karna aur email bhejna
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

      // PDF badge ke sath email send karna
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
        console.error('PDF badge send error:', err.message);
      }
    } else {
      // Rejection alert email bhejna
      sendEmail({
        to: appointment.visitor.email,
        subject: `Visit Request Update: ${appointment.visitor.name}`,
        html: `<h3>Namaste ${appointment.visitor.name},</h3><p>Aapki request <b>${appointment.host.name}</b> ke sath approve nahi ho payi.</p>`
      });
    }

    res.json({
      success: true,
      message: `Appointment ${status} kar diya gaya hai`,
      data: { appointment, pass }
    });
  } catch (error) {
    console.error('updateAppointmentStatus error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createAppointment,
  getAppointments,
  updateAppointmentStatus
};
