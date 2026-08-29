// ==========================================
// Digital Pass & QR Code Controller
// ==========================================
const Pass = require('../models/Pass');
const User = require('../models/User');
const { generatePassPDFBuffer } = require('../utils/pdfGenerator');
const { sendPassIssuedEmail } = require('../utils/emailSender');

// Unique Pass Code generate karne ka helper
const generatePassCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'VP-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// 1. Security Guard ya Admin dwara Gate par on-the-spot pass banana
const issuePass = async (req, res) => {
  try {
    const {
      visitorName,
      visitorEmail,
      visitorPhone,
      visitorCompany,
      hostId,
      purpose,
      validFrom,
      validUntil
    } = req.body;

    if (!visitorName || !visitorEmail || !visitorPhone || !hostId || !purpose) {
      return res.status(400).json({ success: false, message: 'Sabhi required details bharna zaroori hai' });
    }

    const host = await User.findById(hostId);
    if (!host) {
      return res.status(400).json({ success: false, message: 'Host user nahi mila' });
    }

    const passCode = generatePassCode();
    const startTime = validFrom ? new Date(validFrom) : new Date();
    const endTime = validUntil ? new Date(validUntil) : new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 ghante validity

    const pass = await Pass.create({
      passCode,
      visitorName,
      visitorEmail: visitorEmail.toLowerCase().trim(),
      visitorPhone,
      visitorCompany: visitorCompany || 'Independent',
      host: hostId,
      purpose,
      validFrom: startTime,
      validUntil: endTime,
      status: 'ACTIVE',
      qrCodeData: passCode,
      createdBy: req.user._id
    });

    const populatedPass = await Pass.findById(pass._id).populate('host', 'name email department phone');

    // PDF badge bana kar email bhejna
    try {
      const pdfBuffer = await generatePassPDFBuffer({
        passCode,
        visitorName,
        visitorCompany: visitorCompany || 'Independent',
        hostName: host.name,
        purpose,
        validFrom: startTime,
        validUntil: endTime
      });

      sendPassIssuedEmail({
        toEmail: visitorEmail.toLowerCase().trim(),
        visitorName,
        passCode,
        validFrom: startTime,
        validUntil: endTime,
        hostName: host.name,
        pdfBuffer
      }).catch(err => console.error('Pass email error:', err.message));
    } catch (err) {
      console.warn('PDF error:', err.message);
    }

    res.status(201).json({
      success: true,
      message: 'Visitor pass successfully create ho gaya',
      data: populatedPass
    });
  } catch (error) {
    console.error('issuePass error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. User role ke hisab se passes fetch karna
const getPasses = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'Host') {
      filter.host = req.user._id;
    } else if (req.user.role === 'Visitor') {
      filter.visitorEmail = req.user.email.toLowerCase();
    }

    const passes = await Pass.find(filter)
      .populate('host', 'name email department phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: passes.length,
      data: passes
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. QR code ya Pass code ko verify karna (Valid/Expired/Revoked)
const verifyPass = async (req, res) => {
  try {
    const rawCode = req.params.code.trim();
    const cleanCode = rawCode.toUpperCase();

    // Database me code match karna
    const pass = await Pass.findOne({
      $or: [
        { passCode: cleanCode },
        { passCode: rawCode },
        { _id: rawCode.length === 24 ? rawCode : null }
      ]
    }).populate('host', 'name email department phone');

    if (!pass) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: `Is code ka koi pass nahi mila: ${rawCode}`
      });
    }

    // Check karna pass expire toh nahi hua
    const now = new Date();
    const isExpired = now > new Date(pass.validUntil);
    const isRevoked = pass.status === 'REVOKED';
    const isValid = !isExpired && !isRevoked && pass.status === 'ACTIVE';

    res.json({
      success: true,
      valid: isValid,
      status: isExpired ? 'EXPIRED' : pass.status,
      data: pass
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Downloadable PDF Badge generate karna
const downloadPassPDF = async (req, res) => {
  try {
    const pass = await Pass.findById(req.params.id).populate('host', 'name email department');
    if (!pass) {
      return res.status(404).json({ success: false, message: 'Pass nahi mila' });
    }

    const pdfBuffer = await generatePassPDFBuffer({
      passCode: pass.passCode,
      visitorName: pass.visitorName,
      visitorCompany: pass.visitorCompany,
      hostName: pass.host ? pass.host.name : 'N/A',
      purpose: pass.purpose,
      validFrom: pass.validFrom,
      validUntil: pass.validUntil
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="VisitorPass-${pass.passCode}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('downloadPassPDF error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  issuePass,
  getPasses,
  verifyPass,
  downloadPassPDF
};
