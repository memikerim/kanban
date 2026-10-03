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

const nodemailer = require('nodemailer');

// Şifremi Unuttum (Mail Gönderme)
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(404).json({ error: "Bu e-posta adresine kayıtlı bir hesap bulunamadı." });
        }

        // 15 dakikalık JWT token oluştur
        const resetToken = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET || "super_gizli_trello_anahtari",
            { expiresIn: '15m' }
        );

        // Frontend bağlantısını oluştur (hash router olduğu için # eklenir)
        const frontendUrl = req.headers.origin || 'https://kanban-t778.onrender.com';
        const resetLink = `${frontendUrl}/#/reset-password/${resetToken}`;

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error("Sunucu Hatası: EMAIL_USER veya EMAIL_PASS çevresel değişkenleri tanımlanmamış.");
            return res.status(500).json({ error: "Sunucu e-posta göndermek için yapılandırılmamış (Ayarlar eksik)." });
        }

        // Mail gönderimi için ayarlar (Gmail için)
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true, // SSL kullan
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            connectionTimeout: 10000, // 10 saniye içinde bağlanamazsa hata ver
            greetingTimeout: 10000,
            socketTimeout: 10000
        });

        const mailOptions = {
            from: `"Kanban Destek" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'Kanban - Şifre Sıfırlama Talebi',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #dfe1e6; border-radius: 8px;">
                    <h3 style="color: #172b4d;">Şifre Sıfırlama Talebi</h3>
                    <p style="color: #5e6c84;">Merhaba ${user.name},</p>
                    <p style="color: #5e6c84;">Hesabınızın şifresini sıfırlamak için bir talep aldık. Şifrenizi yenilemek için aşağıdaki butona tıklayın:</p>
                    <div style="text-align: center; margin: 20px 0;">
                        <a href="${resetLink}" style="background-color: #0052cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Şifremi Sıfırla</a>
                    </div>
                    <p style="color: #5e6c84; font-size: 13px;">Bu bağlantı 15 dakika boyunca geçerlidir. Eğer bu talebi siz yapmadıysanız lütfen bu e-postayı görmezden gelin.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi." });
    } catch (error) {
        console.error("Şifre sıfırlama maili hatası:", error);
        res.status(500).json({ error: "E-posta gönderilirken bir hata oluştu. Sunucu ayarlarını (EMAIL_USER) kontrol edin." });
    }
};

// Şifre Sıfırlama
const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { newPassword } = req.body;

        if (!token) {
            return res.status(400).json({ error: "Geçersiz veya eksik bağlantı." });
        }

        // Token'ı doğrula
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "super_gizli_trello_anahtari");

        // Yeni şifreyi hash'le ve kaydet
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: decoded.userId },
            data: { password: hashedPassword }
        });

        res.status(200).json({ message: "Şifreniz başarıyla güncellendi. Yeni şifrenizle giriş yapabilirsiniz." });
    } catch (error) {
        console.error("Şifre sıfırlama işlemi hatası:", error);
        if (error.name === 'TokenExpiredError') {
            return res.status(400).json({ error: "Bu şifre sıfırlama bağlantısının süresi dolmuş. Lütfen yeniden talep edin." });
        }
        res.status(400).json({ error: "Geçersiz şifre sıfırlama bağlantısı." });
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

// Kendi hesabını sil (Şifre doğrulaması ile)
const deleteMyAccount = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ error: "Hesabınızı silmek için şifrenizi girmelisiniz." });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: "Kullanıcı bulunamadı." });
        }

        // Şifre doğrulaması
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: "Şifre hatalı! Hesap silinemedi." });
        }

        // Kullanıcının workspace üyeliklerini sil
        await prisma.workspaceMember.deleteMany({ where: { userId } });

        // Kullanıcıyı sil (cascade ile projeler, tasklar vb. de silinir)
        await prisma.user.delete({ where: { id: userId } });

        res.json({ message: "Hesabınız başarıyla silindi." });
    } catch (error) {
        console.error("Hesap silme hatası:", error);
        res.status(500).json({ error: "Hesap silinirken bir hata oluştu." });
    }
};

// Tüm fonksiyonları dışa aktar
module.exports = { register, login, forgotPassword, resetPassword, getMe, deleteMyAccount };