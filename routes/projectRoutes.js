const express = require('express');
const router = express.Router();
const { getProjects, createProject, deleteProject, getProjectBoard, getProjectLogs } = require('../controllers/projectController');
const verifyToken = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware'); 

router.get('/', verifyToken, getProjects);
router.post('/', verifyToken, createProject);
router.delete('/:id', verifyToken, deleteProject);
router.get('/:id/board', verifyToken, getProjectBoard);

// YENİ: Projenin loglarını çeken rota
router.get('/:id/logs', verifyToken, getProjectLogs);

module.exports = router;