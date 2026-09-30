const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const ownerMiddleware = require('../middleware/ownerMiddleware');
const { getAllUsers, updateUserRole, deleteUser } = require('../controllers/userController');

// Tüm route'lar için auth ve owner doğrulamasını uygula
router.use(verifyToken);
router.use(ownerMiddleware);

router.get('/', getAllUsers);
router.put('/:id/role', updateUserRole);
router.delete('/:id', deleteUser);

module.exports = router;
