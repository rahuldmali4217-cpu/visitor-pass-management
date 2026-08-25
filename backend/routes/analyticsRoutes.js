const express = require('express');
const router = express.Router();
const { getDashboardStats, exportLogsCSV } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/dashboard', getDashboardStats);
router.get('/export-csv', authorize('Admin', 'Security'), exportLogsCSV);

module.exports = router;
