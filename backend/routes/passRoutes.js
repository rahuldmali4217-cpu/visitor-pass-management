const express = require('express');
const router = express.Router();
const {
  issuePass,
  getPasses,
  verifyPass,
  downloadPassPDF
} = require('../controllers/passController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/verify/:code', verifyPass);
router.get('/:id/pdf', downloadPassPDF);

router.use(protect);
router.get('/', getPasses);
router.post('/', authorize('Security', 'Admin', 'Host'), issuePass);

module.exports = router;
