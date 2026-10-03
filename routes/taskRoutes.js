const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware'); // Güvenlik kalkanını buraya ekliyoruz
const { createTask, updateTaskOrder, updateTaskDetails, deleteTask, uploadAttachment, deleteAttachment } = require('../controllers/taskController');

// Kritik nokta: Tüm görev rotalarına verifyToken'ı uyguluyoruz ki req.user undefined olmasın.
router.use(verifyToken);

// 1. Yeni görev ekleme
router.post('/', createTask);

// 2. Statik rotalar dinamik rotalardan ÖNCE yazılmalıdır!
router.put('/reorder', updateTaskOrder);

const { upload } = require('../config/cloudinary');

// 3. Dinamik rotalar (içinde :id geçenler)
router.put('/:id', updateTaskDetails);
router.delete('/:id', deleteTask);

// 4. Dosya yükleme ve silme rotaları
router.post('/:id/attachments', upload.single('file'), uploadAttachment);
router.delete('/:id/attachments/:attachmentId', deleteAttachment);

module.exports = router;