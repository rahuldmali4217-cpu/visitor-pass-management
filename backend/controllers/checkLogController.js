const CheckLog = require('../models/CheckLog');
const Pass = require('../models/Pass');

// @desc    Process Check-In (Scan QR code or Enter PassCode)
// @route   POST /api/check-logs/check-in
// @access  Private (Security/Admin)
const processCheckIn = async (req, res) => {
  try {
    const { passCode, remarks } = req.body;

    if (!passCode) {
      return res.status(400).json({ success: false, message: 'Pass code is required' });
    }

    const pass = await Pass.findOne({ passCode: passCode.trim() }).populate('host', 'name');
    if (!pass) {
      return res.status(404).json({ success: false, message: 'Invalid Pass Code' });
    }

    if (pass.status === 'REVOKED') {
      return res.status(400).json({ success: false, message: 'Pass has been REVOKED' });
    }

    // Check if visitor is currently checked in without checking out
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

    const log = await CheckLog.create({
      pass: pass._id,
      passCode: pass.passCode,
      visitorName: pass.visitorName,
      hostName: pass.host ? pass.host.name : 'Host',
      checkInTime: new Date(),
      checkedInBy: req.user._id,
      status: 'CHECKED_IN',
      remarks: remarks || ''
    });

    res.status(201).json({
      success: true,
      message: `Check-in successful for ${pass.visitorName}`,
      data: log
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Process Check-Out
// @route   POST /api/check-logs/check-out
// @access  Private (Security/Admin)
const processCheckOut = async (req, res) => {
  try {
    const { passCode, remarks } = req.body;

    if (!passCode) {
      return res.status(400).json({ success: false, message: 'Pass code is required' });
    }

    const pass = await Pass.findOne({ passCode: passCode.trim() });
    if (!pass) {
      return res.status(404).json({ success: false, message: 'Invalid Pass Code' });
    }

    const activeLog = await CheckLog.findOne({
      pass: pass._id,
      status: 'CHECKED_IN'
    });

    if (!activeLog) {
      return res.status(400).json({
        success: false,
        message: `No active Check-In record found for ${pass.visitorName}`
      });
    }

    activeLog.checkOutTime = new Date();
    activeLog.checkedOutBy = req.user._id;
    activeLog.status = 'CHECKED_OUT';
    if (remarks) activeLog.remarks += ' | ' + remarks;

    await activeLog.save();

    res.json({
      success: true,
      message: `Check-out successful for ${pass.visitorName}`,
      data: activeLog
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Check Logs (Search, Filter, Export)
// @route   GET /api/check-logs
// @access  Private
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
      .populate('checkedInBy', 'name')
      .populate('checkedOutBy', 'name')
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
