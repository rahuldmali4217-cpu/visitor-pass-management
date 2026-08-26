// Pass model, User model, QR Code Generator aur PDF Badge Generator import kar rahe hain
const Pass = require('../models/Pass');
const User = require('../models/User');
const { generateQRCode } = require('../utils/qrGenerator');
const { generatePassPDFBuffer } = require('../utils/pdfGenerator');

// Unique 6-character Pass Code banane ka function (Jaise: VP-AB12CD)
const generatePassCode = () => {
  return 'VP-' + Math.random().toString(36).substr(2, 6).toUpperCase();
};

// 1. Instant Digital Pass Issue karna (Security, Admin ya Host ke dwara)
// POST /api/passes
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

    // Host user check karo
    const host = await User.findById(hostId);
    if (!host) {
      return res.status(400).json({ success: false, message: 'Host not found' });
    }

    const passCode = generatePassCode();
    const qrCodeData = passCode; // QR code me passCode embed hoga

    // Pass database me save karo (default 8 hours validity ke sath)
    const pass = await Pass.create({
      passCode,
      visitorName,
      visitorEmail,
      visitorPhone,
      visitorCompany: visitorCompany || 'Independent',
      host: hostId,
      purpose,
      validFrom: validFrom || new Date(),
      validUntil: validUntil || new Date(Date.now() + 8 * 60 * 60 * 1000),
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

// 2. Role ke according Passes ki list fetch karna
// GET /api/passes
const getPasses = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'Host') {
      filter.host = req.user._id; // Host ko sirf uske visitors dikhenge
    } else if (req.user.role === 'Visitor') {
      filter.visitorEmail = req.user.email; // Visitor ko sirf apna pass dikhega
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

// 3. QR Code / Pass Code scan karke check karna ki pass valid hai ya expired
// GET /api/passes/verify/:code
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

    // Expiry aur status check karo
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

// 4. Pass ka printable PDF Badge generate karke download karwana
// GET /api/passes/:id/pdf
const downloadPassPDF = async (req, res) => {
  try {
    const pass = await Pass.findById(req.params.id).populate('host', 'name email department');
    if (!pass) {
      return res.status(404).json({ success: false, message: 'Pass not found' });
    }

    // PDFKit se instant binary buffer create karna
    const pdfBuffer = await generatePassPDFBuffer({
      passCode: pass.passCode,
      visitorName: pass.visitorName,
      visitorCompany: pass.visitorCompany,
      hostName: pass.host ? pass.host.name : 'N/A',
      purpose: pass.purpose,
      validFrom: pass.validFrom,
      validUntil: pass.validUntil
    });

    // Browser ko PDF download response bhejna
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
