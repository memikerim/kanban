const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const { createWorkspace, joinWorkspace, removeMember, getWorkspaces, addProjectToWorkspace } = require('../controllers/workspaceController');

// Tüm workspace rotaları JWT ile korunuyor
router.use(verifyToken);

// Kullanıcının dahil olduğu workspace'leri getir
router.get('/', getWorkspaces);

// Yeni workspace oluştur
router.post('/', createWorkspace);

// Workspace'e katıl (şifre ile)
router.post('/join', joinWorkspace);

// Workspace'e proje ekle
router.post('/project', addProjectToWorkspace);

// Workspace'ten üye çıkar
router.post('/kick', removeMember);

module.exports = router;
