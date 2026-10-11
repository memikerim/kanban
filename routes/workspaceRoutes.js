const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const {
    createWorkspace, joinWorkspace, removeMember, getWorkspaces, addProjectToWorkspace,
    renameWorkspace, changeWorkspacePassword, changeMemberRole, leaveWorkspace, getWorkspaceLogs
} = require('../controllers/workspaceController');

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

// Alan adı / şifre değiştirme (sadece admin)
router.put('/:id/name', renameWorkspace);
router.put('/:id/password', changeWorkspacePassword);

// Üye yetkisi değiştirme (Admin yap / Adminliği al)
router.put('/:id/role', changeMemberRole);

// Alandan ayrıl
router.post('/:id/leave', leaveWorkspace);

// Alanın son değişiklikleri
router.get('/:id/logs', getWorkspaceLogs);

module.exports = router;
