const prisma = require('../db');

// Tüm kullanıcıları getir (Sadece owner)
const getAllUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, name: true, email: true, role: true },
            orderBy: { name: 'asc' }
        });
        res.json(users);
    } catch (error) {
        console.error('Kullanıcılar getirilirken hata:', error);
        res.status(500).json({ error: "Kullanıcılar yüklenemedi." });
    }
};

// Kullanıcı yetkisini güncelle (Sadece owner)
const updateUserRole = async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    
    // Geçerli yetkiler
    const validRoles = ['user', 'admin', 'owner'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ error: "Geçersiz yetki türü." });
    }

    if (parseInt(id) === req.user.userId && role !== 'owner') {
        return res.status(400).json({ error: "Kendi sahip (owner) yetkinizi kaldıramazsınız!" });
    }

    try {
        const updatedUser = await prisma.user.update({
            where: { id: parseInt(id) },
            data: { role },
            select: { id: true, name: true, email: true, role: true }
        });
        res.json({ message: "Kullanıcı yetkisi güncellendi.", user: updatedUser });
    } catch (error) {
        console.error('Yetki güncellenirken hata:', error);
        res.status(500).json({ error: "Yetki güncellenemedi." });
    }
};

// Kullanıcı sil (Sadece owner)
const deleteUser = async (req, res) => {
    const { id } = req.params;

    if (parseInt(id) === req.user.userId) {
        return res.status(400).json({ error: "Kendi hesabınızı bu menüden silemezsiniz." });
    }

    try {
        await prisma.user.delete({
            where: { id: parseInt(id) }
        });
        res.json({ message: "Kullanıcı başarıyla silindi." });
    } catch (error) {
        console.error('Kullanıcı silinirken hata:', error);
        res.status(500).json({ error: "Kullanıcı silinemedi." });
    }
};

module.exports = { getAllUsers, updateUserRole, deleteUser };
