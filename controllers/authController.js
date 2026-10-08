const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../db');

// KullanÄ±cÄ± KayÄ±t
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: "Bu email zaten kayÄ±tlÄ±." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword
            }
        });

        res.status(201).json({ message: "KullanÄ±cÄ± baÅŸarÄ±yla oluÅŸturuldu." });
    } catch (error) {
        console.error("KayÄ±t hatasÄ±:", error);
        res.status(500).json({ error: "Sunucu hatasÄ±." });
    }
};

// KullanÄ±cÄ± GiriÅŸ
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).json({ error: "KullanÄ±cÄ± bulunamadÄ±." });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ error: "HatalÄ± ÅŸifre." });
        }

        // BURASI KRÄ°TÄ°K: Token'Ä±n iÃ§ine name ve role bilgilerini kesinlikle ekliyoruz
        const token = jwt.sign(
            { userId: user.id, role: user.role, name: user.name }, 
            process.env.JWT_SECRET || "super_gizli_trello_anahtari", 
            { expiresIn: '1d' } 
        );

        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        console.error("GiriÅŸ hatasÄ±:", error);
        res.status(500).json({ error: "Sunucu hatasÄ±." });
    }
};

// Åifremi Unuttum (Mail GÃ¶nderme)
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(404).json({ error: "Bu e-posta adresine kayÄ±tlÄ± bir hesap bulunamadÄ±." });
        }

        // 15 dakikalÄ±k JWT token oluÅŸtur
        const resetToken = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET || "super_gizli_trello_anahtari",
            { expiresIn: '15m' }
        );

        // Frontend baÄŸlantÄ±sÄ±nÄ± oluÅŸtur (hash router olduÄŸu iÃ§in # eklenir)
        const frontendUrl = req.headers.origin || 'https://kanban-t778.onrender.com';
        const resetLink = `${frontendUrl}/#/reset-password/${resetToken}`;

        if (!process.env.BREVO_API_KEY || !process.env.EMAIL_USER) {
            console.error("Sunucu HatasÄ±: BREVO_API_KEY veya EMAIL_USER tanÄ±mlanmamÄ±ÅŸ.");
            return res.status(500).json({ error: "Sunucu e-posta gÃ¶ndermek iÃ§in yapÄ±landÄ±rÄ±lmamÄ±ÅŸ." });
        }

        const https = require('https');

        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #dfe1e6; border-radius: 8px;">
                <h3 style="color: #172b4d;">Åifre SÄ±fÄ±rlama Talebi</h3>
                <p style="color: #5e6c84;">Merhaba ${user.name},</p>
                <p style="color: #5e6c84;">HesabÄ±nÄ±zÄ±n ÅŸifresini sÄ±fÄ±rlamak iÃ§in bir talep aldÄ±k. Åifrenizi yenilemek iÃ§in aÅŸaÄŸÄ±daki butona tÄ±klayÄ±n:</p>
                <div style="text-align: center; margin: 20px 0;">
                    <a href="${resetLink}" style="background-color: #0052cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Åifremi SÄ±fÄ±rla</a>
                </div>
                <p style="color: #5e6c84; font-size: 13px;">Bu baÄŸlantÄ± 15 dakika boyunca geÃ§erlidir. EÄŸer bu talebi siz yapmadÄ±ysanÄ±z lÃ¼tfen bu e-postayÄ± gÃ¶rmezden gelin.</p>
            </div>
        `;

        const payload = JSON.stringify({
            sender: { name: 'Kanban Destek', email: process.env.EMAIL_USER },
            to: [{ email: user.email }],
            subject: 'Kanban - Åifre SÄ±fÄ±rlama Talebi',
            htmlContent: htmlContent
        });

        const options = {
            hostname: 'api.brevo.com',
            port: 443,
            path: '/v3/smtp/email',
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': process.env.BREVO_API_KEY,
                'content-type': 'application/json',
                'content-length': Buffer.byteLength(payload)
            }
        };

        await new Promise((resolve, reject) => {
            const reqHttp = https.request(options, (resHttp) => {
                let responseBody = '';
                resHttp.on('data', (chunk) => { responseBody += chunk; });
                resHttp.on('end', () => {
                    if (resHttp.statusCode >= 200 && resHttp.statusCode < 300) {
                        resolve(responseBody);
                    } else {
                        reject(new Error(`HTTP ${resHttp.statusCode}: ${responseBody}`));
                    }
                });
            });

            reqHttp.on('error', (e) => reject(e));
            reqHttp.write(payload);
            reqHttp.end();
        });

        res.status(200).json({ message: "Åifre sÄ±fÄ±rlama baÄŸlantÄ±sÄ± e-posta adresinize gÃ¶nderildi." });
    } catch (error) {
        console.error("Åifre sÄ±fÄ±rlama maili hatasÄ±:", error);
        res.status(500).json({ error: "E-posta gÃ¶nderilemedi. Hata DetayÄ±: " + (error.message || "Bilinmeyen hata") });
    }
};

// Åifre SÄ±fÄ±rlama
const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { newPassword } = req.body;

        if (!token) {
            return res.status(400).json({ error: "GeÃ§ersiz veya eksik baÄŸlantÄ±." });
        }

        // Token'Ä± doÄŸrula
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "super_gizli_trello_anahtari");

        // Yeni ÅŸifreyi hash'le ve kaydet
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: decoded.userId },
            data: { password: hashedPassword }
        });

        res.status(200).json({ message: "Åifreniz baÅŸarÄ±yla gÃ¼ncellendi. Yeni ÅŸifrenizle giriÅŸ yapabilirsiniz." });
    } catch (error) {
        console.error("Åifre sÄ±fÄ±rlama iÅŸlemi hatasÄ±:", error);
        if (error.name === 'TokenExpiredError') {
            return res.status(400).json({ error: "Bu ÅŸifre sÄ±fÄ±rlama baÄŸlantÄ±sÄ±nÄ±n sÃ¼resi dolmuÅŸ. LÃ¼tfen yeniden talep edin." });
        }
        res.status(400).json({ error: "GeÃ§ersiz ÅŸifre sÄ±fÄ±rlama baÄŸlantÄ±sÄ±." });
    }
};

// Mevcut kullanÄ±cÄ± bilgilerini getir (token'dan)
const getMe = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: { id: true, name: true, email: true, role: true }
        });
        if (!user) {
            return res.status(404).json({ error: "KullanÄ±cÄ± bulunamadÄ±." });
        }
        res.json(user);
    } catch (error) {
        console.error("KullanÄ±cÄ± bilgisi hatasÄ±:", error);
        res.status(500).json({ error: "Sunucu hatasÄ±." });
    }
};

// Kendi hesabÄ±nÄ± sil (Åifre doÄŸrulamasÄ± ile)
const deleteMyAccount = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ error: "HesabÄ±nÄ±zÄ± silmek iÃ§in ÅŸifrenizi girmelisiniz." });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: "KullanÄ±cÄ± bulunamadÄ±." });
        }

        // Åifre doÄŸrulamasÄ±
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: "Åifre hatalÄ±! Hesap silinemedi." });
        }

        // KullanÄ±cÄ±nÄ±n workspace Ã¼yeliklerini sil
        await prisma.workspaceMember.deleteMany({ where: { userId } });

        // KullanÄ±cÄ±yÄ± sil (cascade ile projeler, tasklar vb. de silinir)
        await prisma.user.delete({ where: { id: userId } });

        res.json({ message: "HesabÄ±nÄ±z baÅŸarÄ±yla silindi." });
    } catch (error) {
        console.error("Hesap silme hatasÄ±:", error);
        res.status(500).json({ error: "Hesap silinirken bir hata oluÅŸtu." });
    }
};

// TÃ¼m fonksiyonlarÄ± dÄ±ÅŸa aktar
const changePassword = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { oldPassword, newPassword } = req.body;
        
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: "Kullanıcı bulunamadı." });
        }

        const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ error: "Mevcut şifre hatalı." });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedNewPassword }
        });

        res.json({ message: "Şifreniz başarıyla değiştirildi." });
    } catch (error) {
        console.error("Şifre değiştirme hatası:", error);
        res.status(500).json({ error: "Sunucu hatası." });
    }
};
module.exports = { register, login, forgotPassword, resetPassword, getMe, deleteMyAccount, changePassword };


