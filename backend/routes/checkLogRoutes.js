const express = require('express');
const router = express.Router();
const {
  processCheckIn,
  processCheckOut,
  getCheckLogs
} = require('../controllers/checkLogController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', getCheckLogs);
router.post('/check-in', authorize('Security', 'Admin'), processCheckIn);
router.post('/check-out', authorize('Security', 'Admin'), processCheckOut);

module.exports = router;
