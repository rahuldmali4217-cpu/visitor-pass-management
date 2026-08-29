const Pass = require('../models/Pass');
const User = require('../models/User');
const { generatePassPDFBuffer } = require('../utils/pdfGenerator');
const { sendPassIssuedEmail } = require('../utils/emailSender');

// Helper to generate unique pass code
const generatePassCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'VP-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * @desc    Issue an on-the-spot instant pass (Security, Admin, Host)
 * @route   POST /api/passes
 * @access  Private
 */
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
      return res.status(400).json({ success: false, message: 'Please provide all required visitor details' });
    }

    const host = await User.findById(hostId);
    if (!host) {
      return res.status(400).json({ success: false, message: 'Designated host was not found' });
    }

    const passCode = generatePassCode();
    const startTime = validFrom ? new Date(validFrom) : new Date();
    const endTime = validUntil ? new Date(validUntil) : new Date(Date.now() + 8 * 60 * 60 * 1000); // 8-hour default validity

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

    // Generate PDF badge and email to visitor in the background
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
      }).catch(err => console.error('Failed to email instant pass badge:', err.message));
    } catch (pdfErr) {
      console.warn('Could not generate PDF buffer for instant pass email:', pdfErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Instant pass issued successfully',
      data: populatedPass
    });
  } catch (error) {
    console.error('Error in issuePass:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get all passes (Filtered by user role)
 * @route   GET /api/passes
 * @access  Private
 */
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

/**
 * @desc    Verify QR Code or Pass Code
 * @route   GET /api/passes/verify/:code
 * @access  Public / Security
 */
const verifyPass = async (req, res) => {
  try {
    const rawCode = req.params.code.trim();
    const cleanCode = rawCode.toUpperCase();

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
        message: `No pass found matching code "${rawCode}"`
      });
    }

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

/**
 * @desc    Generate & download printable PDF Badge
 * @route   GET /api/passes/:id/pdf
 * @access  Public / Private
 */
const downloadPassPDF = async (req, res) => {
  try {
    const pass = await Pass.findById(req.params.id).populate('host', 'name email department');
    if (!pass) {
      return res.status(404).json({ success: false, message: 'Pass record not found' });
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
    console.error('Error in downloadPassPDF:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  issuePass,
  getPasses,
  verifyPass,
  downloadPassPDF
};
