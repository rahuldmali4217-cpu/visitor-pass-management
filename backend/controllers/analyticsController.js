const Pass = require('../models/Pass');
const CheckLog = require('../models/CheckLog');
const Appointment = require('../models/Appointment');
const User = require('../models/User');

// @desc    Get system dashboard analytics metrics
// @route   GET /api/analytics/dashboard
// @access  Private (Admin/Security/Host)
const getDashboardStats = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const totalUsers = await User.countDocuments();
    const totalHosts = await User.countDocuments({ role: 'Host' });
    const totalPassesIssued = await Pass.countDocuments();
    
    // Active visitors currently inside
    const currentlyInside = await CheckLog.countDocuments({ status: 'CHECKED_IN' });

    // Today's check-ins
    const todayCheckIns = await CheckLog.countDocuments({
      checkInTime: { $gte: todayStart }
    });

    // Pending appointment requests
    const pendingAppointments = await Appointment.countDocuments({ status: 'PENDING' });

    // Approved appointment requests
    const approvedAppointments = await Appointment.countDocuments({ status: 'APPROVED' });

    res.json({
      success: true,
      data: {
        totalUsers,
        totalHosts,
        totalPassesIssued,
        currentlyInside,
        todayCheckIns,
        pendingAppointments,
        approvedAppointments
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Export Check Logs as CSV
// @route   GET /api/analytics/export-csv
// @access  Private (Admin/Security)
const exportLogsCSV = async (req, res) => {
  try {
    const logs = await CheckLog.find().sort({ createdAt: -1 });

    let csvContent = 'Pass Code,Visitor Name,Host Name,Check In Time,Check Out Time,Status\n';

    logs.forEach((log) => {
      const checkInStr = log.checkInTime ? `"${new Date(log.checkInTime).toLocaleString()}"` : 'N/A';
      const checkOutStr = log.checkOutTime ? `"${new Date(log.checkOutTime).toLocaleString()}"` : 'N/A';
      csvContent += `"${log.passCode}","${log.visitorName}","${log.hostName}",${checkInStr},${checkOutStr},"${log.status}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="Visitor-Logs-Export.csv"');
    res.status(200).send(csvContent);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  exportLogsCSV
};
