const prisma = require('../db');

// YENİ: Projeye hareket (log) ekleme yardımcı fonksiyonu
const logActivity = async (action, projectId, userId) => {
    try {
        await prisma.activityLog.create({
            data: { action, projectId, userId }
        });
    } catch (error) {
        console.error("Log yazılamadı:", error);
    }
};

const createTask = async (req, res) => {
    try {
        const { title, columnId, projectId } = req.body;
        const userId = req.user.userId;

        const tasksInColumn = await prisma.task.count({
            where: { columnId: parseInt(columnId) }
        });

        const newTask = await prisma.task.create({
            data: {
                title,
                columnId: parseInt(columnId),
                projectId: parseInt(projectId),
                order: tasksInColumn,
                userId: parseInt(userId) // YENİ: Görevi ekleyeni kaydet
            },
            include: { user: { select: { name: true } } }
        });

        // Hareketi kaydet
        await logActivity(`"${title}" görevini ekledi.`, parseInt(projectId), parseInt(userId));

        const io = req.app.get('io');
        if (io) io.to(`project_${projectId}`).emit('board_updated');

        res.status(201).json(newTask);
    } catch (error) {
        console.error('Görev eklenirken hata:', error);
        res.status(500).json({ error: 'Görev eklenemedi' });
    }
};

const updateTaskDetails = async (req, res) => {
    const { id } = req.params;
    const { title, description, color, dueDate } = req.body;
    const userId = req.user.userId;

    try {
        const task = await prisma.task.findUnique({ where: { id: parseInt(id) } });
        if (!task) return res.status(404).json({ error: "Görev bulunamadı" });

        const updatedTask = await prisma.task.update({
            where: { id: parseInt(id) },
            data: { title, description, color, dueDate: dueDate ? new Date(dueDate) : null },
            include: { user: { select: { name: true } } }
        });

        await logActivity(`"${updatedTask.title}" görevinin detaylarını güncelledi.`, task.projectId, parseInt(userId));

        const io = req.app.get('io');
        if (io) io.to(`project_${task.projectId}`).emit('board_updated');

        res.json(updatedTask);
    } catch (error) {
        console.error('Görev güncellenirken hata:', error);
        res.status(500).json({ error: 'Görev detayları güncellenemedi' });
    }
};

const deleteTask = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;
    try {
        const task = await prisma.task.findUnique({ where: { id: parseInt(id) } });
        if (!task) return res.status(404).json({ error: "Görev bulunamadı" });
        
        await prisma.task.delete({ where: { id: parseInt(id) } });

        await logActivity(`"${task.title}" görevini sildi.`, task.projectId, parseInt(userId));

        const io = req.app.get('io');
        if (io) io.to(`project_${task.projectId}`).emit('board_updated');

        res.json({ message: 'Görev başarıyla silindi' });
    } catch (error) {
        console.error('Görev silinirken hata:', error);
        res.status(500).json({ error: 'Görev silinemedi' });
    }
};

const updateTaskOrder = async (req, res) => {
    const { updatedTasks } = req.body;
    // Sürükle-bırak işlemi çok sık yapıldığı için buraya bilerek log koymuyoruz, yoksa log ekranı spamlenir.
    try {
        let projectId = null;
        for (const task of updatedTasks) {
            const updated = await prisma.task.update({
                where: { id: task.id },
                data: {
                    columnId: parseInt(task.columnId),
                    order: task.order
                }
            });
            if (!projectId) projectId = updated.projectId;
        }

        // Socket.io ile odadaki diğer kullanıcılara (kendisi hariç) board_updated sinyali gönder
        if (projectId) {
            const io = req.app.get('io');
            if (io) {
                // req.headers['socket-id'] ile göndereni de alabiliriz ama genellikle 
                // doğrudan emit etmek herkesin (veya to(room) ile odanın) almasını sağlar.
                // Eğer frontend tarafında optimistik güncelleme yapılıyorsa, 
                // board_updated alan herkes fetchBoardData() yapabilir.
                io.to(`project_${projectId}`).emit('board_updated');
            }
        }

        res.json({ message: 'Sıralama güncellendi' });
    } catch (error) {
        console.error('Sıralama güncellenirken hata:', error);
        res.status(500).json({ error: 'Sıralama güncellenemedi' });
    }
};

const uploadAttachment = async (req, res) => {
    try {
        const { id } = req.params; // taskId
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'Dosya yüklenemedi' });
        }

        const task = await prisma.task.findUnique({ where: { id: parseInt(id) } });
        if (!task) {
            return res.status(404).json({ error: 'Görev bulunamadı' });
        }

        // Cloudinary yüklemesinden dönen URL ve public_id
        const attachment = await prisma.attachment.create({
            data: {
                url: file.path, // Cloudinary URL'i
                public_id: file.filename, // Cloudinary public_id
                format: file.originalname.split('.').pop() || 'unknown',
                originalName: file.originalname,
                taskId: parseInt(id)
            }
        });

        // Log ekleyelim
        const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
        await logActivity(`"${task.title}" görevine dosya (${file.originalname}) ekledi.`, task.projectId, req.user.userId);

        // Socket.io board güncellemesi
        const io = req.app.get('io');
        if (io) io.to(`project_${task.projectId}`).emit('board_updated');

        res.status(201).json(attachment);
    } catch (error) {
        console.error('Dosya yüklenirken hata:', error);
        res.status(500).json({ error: 'Dosya yüklenemedi' });
    }
};

const deleteAttachment = async (req, res) => {
    try {
        const { id, attachmentId } = req.params;
        
        const attachment = await prisma.attachment.findUnique({
            where: { id: parseInt(attachmentId) },
            include: { task: true }
        });

        if (!attachment) {
            return res.status(404).json({ error: 'Dosya bulunamadı' });
        }

        // Cloudinary'den silme işlemi için config'i içe aktarabiliriz ama 
        // cloudinary paketi ile de direkt silebiliriz.
        const { cloudinary } = require('../config/cloudinary');
        await cloudinary.uploader.destroy(attachment.public_id);

        await prisma.attachment.delete({
            where: { id: parseInt(attachmentId) }
        });

        // Log
        await logActivity(`"${attachment.task.title}" görevinden bir dosyayı sildi.`, attachment.task.projectId, req.user.userId);

        // Socket.io
        const io = req.app.get('io');
        if (io) io.to(`project_${attachment.task.projectId}`).emit('board_updated');

        res.json({ message: 'Dosya başarıyla silindi' });
    } catch (error) {
        console.error('Dosya silinirken hata:', error);
        res.status(500).json({ error: 'Dosya silinemedi' });
    }
};

module.exports = { createTask, updateTaskDetails, deleteTask, updateTaskOrder, uploadAttachment, deleteAttachment };