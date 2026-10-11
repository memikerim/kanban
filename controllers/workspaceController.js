const prisma = require('../db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Benzersiz davet kodu oluştur (8 karakterli, okunabilir)
const generateInviteCode = () => {
    return crypto.randomBytes(4).toString('hex').toUpperCase(); // Örn: "A3F2B1C9"
};

// Çalışma alanı son değişikliklerine kayıt ekle
const logWorkspace = async (workspaceId, userId, action) => {
    try {
        await prisma.workspaceLog.create({
            data: { workspaceId: parseInt(workspaceId), userId: parseInt(userId), action }
        });
    } catch (error) {
        console.error('Alan logu yazılamadı:', error);
    }
};

// Alandaki tüm kullanıcılara anlık güncelleme gönder (Socket.io)
const notifyWorkspace = (req, workspaceId) => {
    const io = req.app.get('io');
    if (io) io.to(`workspace_${workspaceId}`).emit('workspace_updated', { workspaceId: parseInt(workspaceId) });
};

// İstek yapan kullanıcının üyelik kaydını getir
const getMembership = (userId, workspaceId) => prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: parseInt(userId), workspaceId: parseInt(workspaceId) } }
});

// Yeni workspace oluştur
const createWorkspace = async (req, res) => {
    try {
        const { name, password } = req.body;
        const userId = req.user.userId;

        if (!name || !name.trim()) {
            return res.status(400).json({ error: "Çalışma alanı adı boş bırakılamaz." });
        }

        if (!password || !password.trim()) {
            return res.status(400).json({ error: "Alan şifresi zorunludur." });
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

        await logWorkspace(workspace.id, userId, `"${workspace.name}" çalışma alanını oluşturdu.`);

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

        await logWorkspace(workspace.id, userId, "çalışma alanına katıldı.");
        notifyWorkspace(req, workspace.id);

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
            where: { userId_workspaceId: { userId: parseInt(targetUserId), workspaceId: parseInt(workspaceId) } },
            include: { user: { select: { name: true } } }
        });

        if (!targetMember) {
            return res.status(404).json({ error: "Kullanıcı bu çalışma alanının üyesi değil." });
        }

        await prisma.workspaceMember.delete({
            where: { id: targetMember.id }
        });

        await logWorkspace(workspaceId, userId, `"${targetMember.user?.name || 'Bir kullanıcı'}" adlı üyeyi alandan çıkardı.`);
        notifyWorkspace(req, workspaceId);

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

        if (!name || !name.trim()) {
            return res.status(400).json({ error: "Proje adı boş bırakılamaz." });
        }

        const newProject = await prisma.project.create({
            data: {
                name: name.trim(),
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
        await logWorkspace(workspaceId, userId, `"${newProject.name}" projesini oluşturdu.`);
        notifyWorkspace(req, workspaceId);

        res.status(201).json(newProject);
    } catch (error) {
        console.error('Workspace projesi eklenirken hata:', error);
        res.status(500).json({ error: "Proje eklenemedi." });
    }
};

// Alan adını değiştir — sadece ADMIN
const renameWorkspace = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const userId = req.user.userId;

        const requester = await getMembership(userId, id);
        if (!requester || requester.role !== 'ADMIN') {
            return res.status(403).json({ error: "Alan adını sadece adminler değiştirebilir." });
        }

        if (!name || !name.trim()) {
            return res.status(400).json({ error: "Çalışma alanı adı boş bırakılamaz." });
        }

        const workspace = await prisma.workspace.findUnique({ where: { id: parseInt(id) } });
        if (!workspace) return res.status(404).json({ error: "Çalışma alanı bulunamadı." });

        const newName = name.trim();
        if (newName === workspace.name) {
            return res.status(400).json({ error: "Yeni alan adı mevcut adla aynı." });
        }

        await prisma.workspace.update({ where: { id: parseInt(id) }, data: { name: newName } });

        await logWorkspace(id, userId, `alan adını "${workspace.name}" → "${newName}" olarak değiştirdi.`);
        notifyWorkspace(req, id);

        res.json({ message: "Alan adı güncellendi." });
    } catch (error) {
        console.error('Alan adı değiştirilirken hata:', error);
        res.status(500).json({ error: "Alan adı değiştirilemedi." });
    }
};

// Alan şifresini değiştir — sadece ADMIN
const changeWorkspacePassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;
        const userId = req.user.userId;

        const requester = await getMembership(userId, id);
        if (!requester || requester.role !== 'ADMIN') {
            return res.status(403).json({ error: "Alan şifresini sadece adminler değiştirebilir." });
        }

        if (!newPassword || !newPassword.trim()) {
            return res.status(400).json({ error: "Yeni alan şifresi boş bırakılamaz." });
        }
        if (newPassword.length < 4) {
            return res.status(400).json({ error: "Şifre en az 4 karakter olmalıdır." });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.workspace.update({ where: { id: parseInt(id) }, data: { password: hashedPassword } });

        await logWorkspace(id, userId, "alan şifresini değiştirdi. Yeni katılımlarda güncel şifre kullanılmalıdır.");
        notifyWorkspace(req, id);

        res.json({ message: "Alan şifresi güncellendi." });
    } catch (error) {
        console.error('Alan şifresi değiştirilirken hata:', error);
        res.status(500).json({ error: "Alan şifresi değiştirilemedi." });
    }
};

// Üyenin yetkisini değiştir (Admin yap / Adminliği al) — sadece ADMIN
const changeMemberRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { targetUserId, role } = req.body;
        const userId = req.user.userId;

        if (!['ADMIN', 'MEMBER'].includes(role)) {
            return res.status(400).json({ error: "Geçersiz yetki." });
        }

        const requester = await getMembership(userId, id);
        if (!requester || requester.role !== 'ADMIN') {
            return res.status(403).json({ error: "Yetki değişikliğini sadece adminler yapabilir." });
        }

        const target = await prisma.workspaceMember.findUnique({
            where: { userId_workspaceId: { userId: parseInt(targetUserId), workspaceId: parseInt(id) } },
            include: { user: { select: { name: true } } }
        });
        if (!target) return res.status(404).json({ error: "Kullanıcı bu çalışma alanının üyesi değil." });
        if (target.role === role) return res.status(400).json({ error: "Kullanıcı zaten bu yetkiye sahip." });

        // Son adminin adminliği alınamaz
        if (role === 'MEMBER') {
            const adminCount = await prisma.workspaceMember.count({ where: { workspaceId: parseInt(id), role: 'ADMIN' } });
            if (adminCount <= 1) {
                return res.status(400).json({
                    error: "Alanda en az bir admin bulunmalıdır. Önce başka bir üyeyi admin olarak atayın.",
                    code: 'LAST_ADMIN'
                });
            }
        }

        await prisma.workspaceMember.update({ where: { id: target.id }, data: { role } });

        const targetName = target.user?.name || 'Bir kullanıcı';
        const action = parseInt(targetUserId) === parseInt(userId)
            ? "kendi adminlik yetkisini bıraktı."
            : (role === 'ADMIN'
                ? `"${targetName}" adlı üyeyi admin olarak atadı.`
                : `"${targetName}" adlı üyenin adminlik yetkisini kaldırdı.`);
        await logWorkspace(id, userId, action);
        notifyWorkspace(req, id);

        res.json({ message: "Yetki güncellendi." });
    } catch (error) {
        console.error('Yetki değiştirilirken hata:', error);
        res.status(500).json({ error: "Yetki değiştirilemedi." });
    }
};

// Alandan ayrıl — tek admin ayrılıyorsa önce yeni admin ataması gerekir
const leaveWorkspace = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const membership = await getMembership(userId, id);
        if (!membership) return res.status(404).json({ error: "Bu çalışma alanının üyesi değilsiniz." });

        const memberCount = await prisma.workspaceMember.count({ where: { workspaceId: parseInt(id) } });

        // Alandaki son kişi ayrılıyorsa alan tamamen silinir
        if (memberCount <= 1) {
            await prisma.workspace.delete({ where: { id: parseInt(id) } });
            return res.json({ message: "Alandaki son üye olduğunuz için çalışma alanı silindi.", deleted: true });
        }

        if (membership.role === 'ADMIN') {
            const adminCount = await prisma.workspaceMember.count({ where: { workspaceId: parseInt(id), role: 'ADMIN' } });
            if (adminCount <= 1) {
                return res.status(400).json({
                    error: "Alandaki tek admin sizsiniz. Ayrılmadan önce başka bir üyeyi admin olarak atamalısınız.",
                    code: 'LAST_ADMIN'
                });
            }
        }

        await prisma.workspaceMember.delete({ where: { id: membership.id } });

        await logWorkspace(id, userId, "çalışma alanından ayrıldı.");
        notifyWorkspace(req, id);

        res.json({ message: "Çalışma alanından ayrıldınız." });
    } catch (error) {
        console.error('Alandan ayrılırken hata:', error);
        res.status(500).json({ error: "Alandan ayrılınamadı." });
    }
};

// Alanın son değişikliklerini getir — sadece üyeler
const getWorkspaceLogs = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const membership = await getMembership(userId, id);
        if (!membership) return res.status(403).json({ error: "Bu çalışma alanının üyesi değilsiniz." });

        const logs = await prisma.workspaceLog.findMany({
            where: { workspaceId: parseInt(id) },
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { name: true } } },
            take: 50
        });
        res.json(logs);
    } catch (error) {
        console.error('Alan logları getirilirken hata:', error);
        res.status(500).json({ error: "Alan logları getirilemedi." });
    }
};

module.exports = {
    createWorkspace, joinWorkspace, removeMember, getWorkspaces, addProjectToWorkspace,
    renameWorkspace, changeWorkspacePassword, changeMemberRole, leaveWorkspace, getWorkspaceLogs
};
