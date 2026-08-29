const CheckLog = require('../models/CheckLog');
const Pass = require('../models/Pass');
const User = require('../models/User');
const { sendHostArrivalAlert } = require('../utils/emailSender');
const { sendSMS } = require('../utils/smsSender');

/**
 * @desc    Process Gate Check-In via QR Code or PassCode
 * @route   POST /api/check-logs/check-in
 * @access  Private (Security / Admin)
 */
const processCheckIn = async (req, res) => {
  try {
    const { passCode, remarks } = req.body;

    if (!passCode) {
      return res.status(400).json({ success: false, message: 'Pass code is required' });
    }

    const cleanPassCode = passCode.trim().toUpperCase();
    const pass = await Pass.findOne({ passCode: cleanPassCode }).populate('host', 'name email phone department');

    if (!pass) {
      return res.status(404).json({ success: false, message: 'Invalid Visitor Pass Code' });
    }

    if (pass.status === 'REVOKED') {
      return res.status(400).json({ success: false, message: 'This pass has been REVOKED by security or administration' });
    }

    // Check pass validity window
    const now = new Date();
    if (now > new Date(pass.validUntil)) {
      return res.status(400).json({
        success: false,
        message: `Pass expired at ${new Date(pass.validUntil).toLocaleString()}`
      });
    }

    // Check if visitor is already checked in
    const activeLog = await CheckLog.findOne({
      pass: pass._id,
      status: 'CHECKED_IN'
    });

    if (activeLog) {
      return res.status(400).json({
        success: false,
        message: `Visitor ${pass.visitorName} is ALREADY checked in since ${new Date(activeLog.checkInTime).toLocaleTimeString()}`
      });
    }

    const checkInTime = new Date();

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

    // Notify Host in real-time via Email & SMS that their visitor has arrived
    if (pass.host && pass.host.email) {
      sendHostArrivalAlert({
        hostEmail: pass.host.email,
        hostName: pass.host.name,
        visitorName: pass.visitorName,
        passCode: pass.passCode,
        checkInTime,
        remarks: remarks || 'Gate verification completed'
      }).catch(err => console.error('Host check-in email alert error:', err.message));

      if (pass.host.phone) {
        sendSMS({
          toPhone: pass.host.phone,
          message: `Visitor Alert: ${pass.visitorName} (Pass: ${pass.passCode}) has checked in at the security gate.`
        }).catch(err => console.error('Host check-in SMS alert error:', err.message));
      }
    }

    res.status(201).json({
      success: true,
      message: `Check-in recorded successfully for ${pass.visitorName}`,
      data: log
    });
  } catch (error) {
    console.error('Error in processCheckIn:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Process Gate Check-Out
 * @route   POST /api/check-logs/check-out
 * @access  Private (Security / Admin)
 */
const processCheckOut = async (req, res) => {
  try {
    const { passCode, remarks } = req.body;

    if (!passCode) {
      return res.status(400).json({ success: false, message: 'Pass code is required' });
    }

    const cleanPassCode = passCode.trim().toUpperCase();
    const pass = await Pass.findOne({ passCode: cleanPassCode });

    if (!pass) {
      return res.status(404).json({ success: false, message: 'Invalid Visitor Pass Code' });
    }

    const activeLog = await CheckLog.findOne({
      pass: pass._id,
      status: 'CHECKED_IN'
    });

    if (!activeLog) {
      return res.status(400).json({
        success: false,
        message: `No active entry log found for ${pass.visitorName}. Visitor is not marked as inside.`
      });
    }

    activeLog.checkOutTime = new Date();
    activeLog.checkedOutBy = req.user._id;
    activeLog.status = 'CHECKED_OUT';
    if (remarks) activeLog.remarks += ` | ${remarks}`;

    await activeLog.save();

    res.json({
      success: true,
      message: `Check-out recorded successfully for ${pass.visitorName}`,
      data: activeLog
    });
  } catch (error) {
    console.error('Error in processCheckOut:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get Check Logs with search and filtering
 * @route   GET /api/check-logs
 * @access  Private (Security / Admin / Host)
 */
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
