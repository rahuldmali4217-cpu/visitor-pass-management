// ==========================================
// Admin Analytics & CSV Export Controller
// ==========================================
const Pass = require('../models/Pass');
const CheckLog = require('../models/CheckLog');
const Appointment = require('../models/Appointment');
const User = require('../models/User');

// 1. Dashboard ke counters aur metrics calculate karna
const getDashboardStats = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Database counts nikalna
    const totalUsers = await User.countDocuments();
    const totalHosts = await User.countDocuments({ role: 'Host' });
    const totalPassesIssued = await Pass.countDocuments();
    
    // Abhi kitne log building ke andar hain
    const currentlyInside = await CheckLog.countDocuments({ status: 'CHECKED_IN' });

    // Aaj ke check-ins count
    const todayCheckIns = await CheckLog.countDocuments({
      checkInTime: { $gte: todayStart }
    });

    // Pending aur Approved appointments
    const pendingAppointments = await Appointment.countDocuments({ status: 'PENDING' });
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

// 2. Gate Logs ko Excel/CSV file me export karna
const exportLogsCSV = async (req, res) => {
  try {
    const logs = await CheckLog.find().sort({ createdAt: -1 });

    // CSV format ka header
    let csvContent = 'Pass Code,Visitor Name,Host Name,Check In Time,Check Out Time,Status\n';

    // Har log ko CSV row me convert karna
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
