// ==========================================
// Security Gate Check-In / Check-Out Controller
// ==========================================
const CheckLog = require('../models/CheckLog');
const Pass = require('../models/Pass');
const User = require('../models/User');
const { sendHostArrivalAlert } = require('../utils/emailSender');
const { sendSMS } = require('../utils/smsSender');

// 1. Gate par Visitor ka Check-In process karna
const processCheckIn = async (req, res) => {
  try {
    const { passCode, remarks } = req.body;

    if (!passCode) {
      return res.status(400).json({ success: false, message: 'Pass code enter karna zaroori hai' });
    }

    const cleanCode = passCode.trim().toUpperCase();
    const pass = await Pass.findOne({ passCode: cleanCode }).populate('host', 'name email phone department');

    if (!pass) {
      return res.status(404).json({ success: false, message: 'Galat Visitor Pass Code' });
    }

    if (pass.status === 'REVOKED') {
      return res.status(400).json({ success: false, message: 'Ye pass cancel/revoke kar diya gaya hai' });
    }

    // Expiry check
    const now = new Date();
    if (now > new Date(pass.validUntil)) {
      return res.status(400).json({
        success: false,
        message: `Pass expire ho chuka hai (${new Date(pass.validUntil).toLocaleTimeString()})`
      });
    }

    // Double check-in prevention (Agar visitor pehle se andar hai)
    const activeLog = await CheckLog.findOne({
      pass: pass._id,
      status: 'CHECKED_IN'
    });

    if (activeLog) {
      return res.status(400).json({
        success: false,
        message: `Visitor pehle se checked-in hai (${new Date(activeLog.checkInTime).toLocaleTimeString()})`
      });
    }

    const checkInTime = new Date();

    // Entry record save karna
    const log = await CheckLog.create({
      pass: pass._id,
      passCode: pass.passCode,
      visitorName: pass.visitorName,
      hostName: pass.host ? pass.host.name : 'N/A',
      checkInTime,
      checkedInBy: req.user._id,
      status: 'CHECKED_IN',
      remarks: remarks || 'Verified at Security Gate'
    });

    // Host ko email aur SMS alert bhejna ki visitor pahunch chuka hai
    if (pass.host && pass.host.email) {
      sendHostArrivalAlert({
        hostEmail: pass.host.email,
        hostName: pass.host.name,
        visitorName: pass.visitorName,
        passCode: pass.passCode,
        checkInTime,
        remarks: remarks || 'Gate verification completed'
      }).catch(err => console.error('Host alert email error:', err.message));

      if (pass.host.phone) {
        sendSMS({
          toPhone: pass.host.phone,
          message: `Visitor Alert: ${pass.visitorName} (Pass: ${pass.passCode}) gate par check-in ho chuka hai.`
        }).catch(err => console.error('Host alert sms error:', err.message));
      }
    }

    res.status(201).json({
      success: true,
      message: `${pass.visitorName} ka check-in complete ho gaya`,
      data: log
    });
  } catch (error) {
    console.error('processCheckIn error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Gate par Visitor ka Check-Out process karna
const processCheckOut = async (req, res) => {
  try {
    const { passCode, remarks } = req.body;

    if (!passCode) {
      return res.status(400).json({ success: false, message: 'Pass code enter karna zaroori hai' });
    }

    const cleanCode = passCode.trim().toUpperCase();
    const pass = await Pass.findOne({ passCode: cleanCode });

    if (!pass) {
      return res.status(404).json({ success: false, message: 'Galat Visitor Pass Code' });
    }

    // Active entry record dhoondhna
    const activeLog = await CheckLog.findOne({
      pass: pass._id,
      status: 'CHECKED_IN'
    });

    if (!activeLog) {
      return res.status(400).json({
        success: false,
        message: `${pass.visitorName} ka koi active check-in nahi mila`
      });
    }

    activeLog.checkOutTime = new Date();
    activeLog.checkedOutBy = req.user._id;
    activeLog.status = 'CHECKED_OUT';
    if (remarks) activeLog.remarks += ` | ${remarks}`;

    await activeLog.save();

    res.json({
      success: true,
      message: `${pass.visitorName} ka check-out complete ho gaya`,
      data: activeLog
    });
  } catch (error) {
    console.error('processCheckOut error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Security Check Logs fetch karna (Filters ke sath)
const getCheckLogs = async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};

    if (status) filter.status = status;

    if (search) {
      filter.$or = [
        { visitorName: { $regex: search, $options: 'i' } },
        { passCode: { $regex: search, $options: 'i' } },
        { hostName: { $regex: search, $options: 'i' } }
      ];
    }

    const logs = await CheckLog.find(filter)
      .populate('checkedInBy', 'name email')
      .populate('checkedOutBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  processCheckIn,
  processCheckOut,
  getCheckLogs
};
