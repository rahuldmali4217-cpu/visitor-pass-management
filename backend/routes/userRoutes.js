const express = require('express');
const router = express.Router();
const { getUsers, createUser, updateUser, deleteUser } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getUsers);
router.post('/', authorize('Admin'), createUser);
router.put('/:id', authorize('Admin'), updateUser);
router.delete('/:id', authorize('Admin'), deleteUser);

module.exports = router;
