const prisma = require('../db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Benzersiz davet kodu oluştur (8 karakterli, okunabilir)
const generateInviteCode = () => {
    return crypto.randomBytes(4).toString('hex').toUpperCase(); // Örn: "A3F2B1C9"
};

// Yeni workspace oluştur
const createWorkspace = async (req, res) => {
    try {
        const { name, password } = req.body;
        const userId = req.user.userId;

        if (!name || !password) {
            return res.status(400).json({ error: "Alan adı ve şifre zorunludur." });
        }

        if (password.length < 4) {
            return res.status(400).json({ error: "Şifre en az 4 karakter olmalıdır." });
        }

        // Şifreyi hashle
        const hashedPassword = await bcrypt.hash(password, 10);

        // Benzersiz davet kodu oluştur
        let inviteCode = generateInviteCode();
        // Çakışma kontrolü
        let exists = await prisma.workspace.findUnique({ where: { inviteCode } });
        while (exists) {
            inviteCode = generateInviteCode();
            exists = await prisma.workspace.findUnique({ where: { inviteCode } });
        }

        const workspace = await prisma.workspace.create({
            data: {
                name,
                password: hashedPassword,
                inviteCode,
                members: {
                    create: {
                        userId: parseInt(userId),
                        role: 'ADMIN' // Oluşturan kişi otomatik admin
                    }
                }
            },
            include: {
                members: {
                    include: { user: { select: { id: true, name: true, email: true } } }
                }
            }
        });

        res.status(201).json({
            message: "Çalışma alanı oluşturuldu.",
            workspace: {
                id: workspace.id,
                name: workspace.name,
                inviteCode: workspace.inviteCode,
                createdAt: workspace.createdAt,
                members: workspace.members
            }
        });
    } catch (error) {
        console.error('Workspace oluşturulurken hata:', error);
        res.status(500).json({ error: "Çalışma alanı oluşturulamadı." });
    }
};

// Workspace'e katıl (davet kodu + şifre ile)
const joinWorkspace = async (req, res) => {
    try {
        const { inviteCode, password } = req.body;
        const userId = req.user.userId;

        if (!inviteCode || !password) {
            return res.status(400).json({ error: "Davet kodu ve şifre gereklidir." });
        }

        // Workspace'i davet kodu ile bul
        const workspace = await prisma.workspace.findUnique({
            where: { inviteCode: inviteCode.toUpperCase().trim() }
        });

        if (!workspace) {
            return res.status(404).json({ error: "Bu davet koduna ait çalışma alanı bulunamadı." });
        }

        // Şifreyi doğrula
        const isMatch = await bcrypt.compare(password, workspace.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Şifre hatalı!" });
        }

        // Zaten üye mi kontrol et
        const existingMember = await prisma.workspaceMember.findUnique({
            where: { userId_workspaceId: { userId: parseInt(userId), workspaceId: workspace.id } }
        });

        if (existingMember) {
            return res.status(400).json({ error: "Zaten bu çalışma alanının üyesisiniz." });
        }

        // Üye olarak ekle
        await prisma.workspaceMember.create({
            data: {
                userId: parseInt(userId),
                workspaceId: workspace.id,
                role: 'MEMBER'
            }
        });

        res.json({ message: `"${workspace.name}" çalışma alanına başarıyla katıldınız.` });
    } catch (error) {
        console.error('Workspace\'e katılırken hata:', error);
        res.status(500).json({ error: "Çalışma alanına katılınamadı." });
    }
};

// Workspace'ten üye çıkar (kick) — sadece ADMIN yapabilir
const removeMember = async (req, res) => {
    try {
        const { workspaceId, targetUserId } = req.body;
        const userId = req.user.userId;

        // İstek yapan kişinin ADMIN olup olmadığını kontrol et
        const requester = await prisma.workspaceMember.findUnique({
            where: { userId_workspaceId: { userId: parseInt(userId), workspaceId: parseInt(workspaceId) } }
        });

        if (!requester || requester.role !== 'ADMIN') {
            return res.status(403).json({ error: "Bu işlem için çalışma alanı adminleri yetkilidir." });
        }

        // Kendini çıkarmayı engelle
        if (parseInt(userId) === parseInt(targetUserId)) {
            return res.status(400).json({ error: "Kendinizi çalışma alanından çıkaramazsınız." });
        }

        // Hedef üyeliği bul ve sil
        const targetMember = await prisma.workspaceMember.findUnique({
            where: { userId_workspaceId: { userId: parseInt(targetUserId), workspaceId: parseInt(workspaceId) } }
        });

        if (!targetMember) {
            return res.status(404).json({ error: "Kullanıcı bu çalışma alanının üyesi değil." });
        }

        await prisma.workspaceMember.delete({
            where: { id: targetMember.id }
        });

        res.json({ message: "Üye çalışma alanından çıkarıldı." });
    } catch (error) {
        console.error('Üye çıkarılırken hata:', error);
        res.status(500).json({ error: "Üye çıkarılamadı." });
    }
};

// Oturum açmış kullanıcının dahil olduğu tüm workspace'leri getir
const getWorkspaces = async (req, res) => {
    try {
        const userId = req.user.userId;

        const memberships = await prisma.workspaceMember.findMany({
            where: { userId: parseInt(userId) },
            include: {
                workspace: {
                    include: {
                        members: {
                            include: { user: { select: { id: true, name: true, email: true } } }
                        },
                        projects: {
                            include: { user: { select: { name: true } } }
                        }
                    }
                }
            }
        });

        const workspaces = memberships.map(m => ({
            id: m.workspace.id,
            name: m.workspace.name,
            inviteCode: m.workspace.inviteCode,
            myRole: m.role,
            createdAt: m.workspace.createdAt,
            members: m.workspace.members,
            projects: m.workspace.projects
        }));

        res.json(workspaces);
    } catch (error) {
        console.error('Workspace\'ler getirilirken hata:', error);
        res.status(500).json({ error: "Çalışma alanları getirilemedi." });
    }
};

// Workspace'e proje ekle
const addProjectToWorkspace = async (req, res) => {
    try {
        const { workspaceId, name } = req.body;
        const userId = req.user.userId;

        // Üyelik kontrolü
        const member = await prisma.workspaceMember.findUnique({
            where: { userId_workspaceId: { userId: parseInt(userId), workspaceId: parseInt(workspaceId) } }
        });

        if (!member) {
            return res.status(403).json({ error: "Bu çalışma alanının üyesi değilsiniz." });
        }

        const newProject = await prisma.project.create({
            data: {
                name,
                userId: parseInt(userId),
                workspaceId: parseInt(workspaceId),
                columns: {
                    create: [
                        { title: 'Yapılacaklar', order: 0 },
                        { title: 'Devam Edenler', order: 1 },
                        { title: 'Tamamlandı', order: 2 }
                    ]
                }
            },
            include: { user: { select: { name: true } } }
        });

        // Diğer kullanıcılara anlık güncelleme gönder
        const io = req.app.get('io');
        if (io) io.to(`workspace_${workspaceId}`).emit('workspace_updated');

        res.status(201).json(newProject);
    } catch (error) {
        console.error('Workspace projesi eklenirken hata:', error);
        res.status(500).json({ error: "Proje eklenemedi." });
    }
};

module.exports = { createWorkspace, joinWorkspace, removeMember, getWorkspaces, addProjectToWorkspace };
