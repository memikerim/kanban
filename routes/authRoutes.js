const express = require('express');
const router = express.Router();
// Yeni fonksiyonları süslü parantez içine ekledik
const { register, login, forgotPassword, resetPassword, getMe, deleteMyAccount } = require('../controllers/authController');
const verifyToken = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);

// Mevcut kullanıcı bilgilerini getir
router.get('/me', verifyToken, getMe);

// Kendi hesabını sil
router.post('/delete-account', verifyToken, deleteMyAccount);

// Şifremi Unuttum ve Şifre Sıfırlama rotaları
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

module.exports = router;