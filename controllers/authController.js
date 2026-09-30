const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../db');

// Kullanıcı Kayıt
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: "Bu email zaten kayıtlı." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword
            }
        });

        res.status(201).json({ message: "Kullanıcı başarıyla oluşturuldu." });
    } catch (error) {
        console.error("Kayıt hatası:", error);
        res.status(500).json({ error: "Sunucu hatası." });
    }
};

// Kullanıcı Giriş
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).json({ error: "Kullanıcı bulunamadı." });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ error: "Hatalı şifre." });
        }

        // BURASI KRİTİK: Token'ın içine name ve role bilgilerini kesinlikle ekliyoruz
        const token = jwt.sign(
            { userId: user.id, role: user.role, name: user.name }, 
            process.env.JWT_SECRET || "super_gizli_trello_anahtari", 
            { expiresIn: '1d' } 
        );

        res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
    } catch (error) {
        console.error("Giriş hatası:", error);
        res.status(500).json({ error: "Sunucu hatası." });
    }
};

// Şifremi Unuttum İskeleti (Çökmeyi Engeller)
const forgotPassword = async (req, res) => {
    try {
        res.status(200).json({ message: "Şifre sıfırlama bağlantısı gönderildi." });
    } catch (error) {
        res.status(500).json({ error: "İşlem başarısız." });
    }
};

// Şifre Sıfırlama İskeleti (Çökmeyi Engeller)
const resetPassword = async (req, res) => {
    try {
        res.status(200).json({ message: "Şifre başarıyla sıfırlandı." });
    } catch (error) {
        res.status(500).json({ error: "İşlem başarısız." });
    }
};

// Mevcut kullanıcı bilgilerini getir (token'dan)
const getMe = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: { id: true, name: true, email: true, role: true }
        });
        if (!user) {
            return res.status(404).json({ error: "Kullanıcı bulunamadı." });
        }
        res.json(user);
    } catch (error) {
        console.error("Kullanıcı bilgisi hatası:", error);
        res.status(500).json({ error: "Sunucu hatası." });
    }
};

// Tüm fonksiyonları dışa aktar
module.exports = { register, login, forgotPassword, resetPassword, getMe };