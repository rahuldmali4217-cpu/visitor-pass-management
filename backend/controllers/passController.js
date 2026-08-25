const Pass = require('../models/Pass');
const User = require('../models/User');
const { generateQRCode } = require('../utils/qrGenerator');
const { generatePassPDFBuffer } = require('../utils/pdfGenerator');

const generatePassCode = () => {
  return 'VP-' + Math.random().toString(36).substr(2, 6).toUpperCase();
};

// @desc    Issue an instant Pass (Security or Admin)
// @route   POST /api/passes
// @access  Private (Security/Admin/Host)
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
      return res.status(400).json({ success: false, message: 'Please fill all required visitor details' });
    }

    const host = await User.findById(hostId);
    if (!host) {
      return res.status(400).json({ success: false, message: 'Host not found' });
    }

    const passCode = generatePassCode();
    const qrCodeData = passCode;

    const pass = await Pass.create({
      passCode,
      visitorName,
      visitorEmail,
      visitorPhone,
      visitorCompany: visitorCompany || 'Independent',
      host: hostId,
      purpose,
      validFrom: validFrom || new Date(),
      validUntil: validUntil || new Date(Date.now() + 8 * 60 * 60 * 1000), // Default 8 hours validity
      status: 'ACTIVE',
      qrCodeData,
      createdBy: req.user._id
    });

    const populatedPass = await Pass.findById(pass._id).populate('host', 'name email department phone');

    res.status(201).json({
      success: true,
      data: populatedPass
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all passes (Admin/Security see all, Host sees their visitors, Visitor sees theirs)
// @route   GET /api/passes
// @access  Private
const getPasses = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'Host') {
      filter.host = req.user._id;
    } else if (req.user.role === 'Visitor') {
      filter.visitorEmail = req.user.email;
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

// @desc    Get Pass details by PassCode or ID & Verify QR Code
// @route   GET /api/passes/verify/:code
// @access  Private / Public (Security verify)
const verifyPass = async (req, res) => {
  try {
    const code = req.params.code.trim();
    const pass = await Pass.findOne({
      $or: [{ passCode: code }, { _id: code.length === 24 ? code : null }]
    }).populate('host', 'name email department phone');

    if (!pass) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: 'Invalid Visitor Pass Code'
      });
    }

    const now = new Date();
    const isExpired = now > new Date(pass.validUntil);
    const isRevoked = pass.status === 'REVOKED';

    res.json({
      success: true,
      valid: !isExpired && !isRevoked && pass.status === 'ACTIVE',
      status: isExpired ? 'EXPIRED' : pass.status,
      data: pass
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Download PDF Badge for a Pass
// @route   GET /api/passes/:id/pdf
// @access  Public / Private
const downloadPassPDF = async (req, res) => {
  try {
    const pass = await Pass.findById(req.params.id).populate('host', 'name email department');
    if (!pass) {
      return res.status(404).json({ success: false, message: 'Pass not found' });
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
    res.setHeader('Content-Disposition', `attachment; filename="Pass-${pass.passCode}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  issuePass,
  getPasses,
  verifyPass,
  downloadPassPDF
};
