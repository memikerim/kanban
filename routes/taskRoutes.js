const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware'); // Güvenlik kalkanını buraya ekliyoruz
const { createTask, updateTaskOrder, updateTaskDetails, deleteTask } = require('../controllers/taskController');

// Kritik nokta: Tüm görev rotalarına verifyToken'ı uyguluyoruz ki req.user undefined olmasın.
router.use(verifyToken);

// 1. Yeni görev ekleme
router.post('/', createTask);

// 2. Statik rotalar dinamik rotalardan ÖNCE yazılmalıdır!
router.put('/reorder', updateTaskOrder);

// 3. Dinamik rotalar (içinde :id geçenler)
router.put('/:id', updateTaskDetails);
router.delete('/:id', deleteTask);

module.exports = router;