const prisma = require('../db');

const getProjects = async (req, res) => {
    try {
        const projects = await prisma.project.findMany({
            include: { user: { select: { name: true } } }
        });
        res.json(projects);
    } catch (error) {
        console.error('Projeler getirilirken hata:', error);
        res.status(500).json({ error: "Projeler yüklenemedi." });
    }
};

const createProject = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.userId;

    if (!userId) {
      return res.status(400).json({ error: "Kullanıcı kimliği alınamadı." });
    }

    const newProject = await prisma.project.create({
      data: {
        name: name,
        userId: parseInt(userId),
        columns: {
          create: [
            { title: 'Yapılacaklar', order: 0 },
            { title: 'Devam Edenler', order: 1 },
            { title: 'Tamamlandı', order: 2 }
          ]
        }
      }
    });

    // Proje oluşturulduğunda da ilk logu atalım
    await prisma.activityLog.create({
        data: { action: "Projeyi oluşturdu.", projectId: newProject.id, userId: parseInt(userId) }
    });

    res.status(201).json(newProject);
  } catch (error) {
    console.error("Proje ekleme hatası:", error);
    res.status(500).json({ error: "Proje oluşturulamadı." });
  }
};

const deleteProject = async (req, res) => {
    const { id } = req.params;
    try {
        const project = await prisma.project.findUnique({ where: { id: parseInt(id) } });
        if (!project) return res.status(404).json({ error: "Proje bulunamadı." });

        const isAdmin = req.user.role && req.user.role.toLowerCase() === 'admin';
        const isOwner = parseInt(project.userId) === parseInt(req.user.userId);

        if (!isAdmin && !isOwner) {
            return res.status(403).json({ error: "Sadece kendi oluşturduğunuz projeleri silebilirsiniz!" });
        }

        await prisma.project.delete({ where: { id: parseInt(id) } });
        res.json({ message: "Proje başarıyla silindi." });
    } catch (error) {
        console.error('Proje silinirken hata:', error);
        res.status(500).json({ error: "Proje silinemedi." });
    }
};

const getProjectBoard = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({
      where: { id: parseInt(id) },
      include: {
        columns: {
          orderBy: { order: 'asc' },
          include: {
            tasks: {
              orderBy: { order: 'asc' },
              include: { user: { select: { name: true } } } // YENİ: Görevi ekleyeni getir
            }
          }
        }
      }
    });

    if (!project) return res.status(404).json({ error: 'Proje bulunamadı' });
    res.json(project.columns);
  } catch (error) {
    console.error('Pano verileri getirme hatası:', error);
    res.status(500).json({ error: 'Pano verileri getirilemedi' });
  }
};

// YENİ: Projedeki son hareketleri (Logları) getir
const getProjectLogs = async (req, res) => {
    try {
        const { id } = req.params;
        const logs = await prisma.activityLog.findMany({
            where: { projectId: parseInt(id) },
            orderBy: { createdAt: 'desc' }, // En yeniler en üstte
            include: { user: { select: { name: true } } },
            take: 50 // Sadece son 50 hareketi al
        });
        res.json(logs);
    } catch (error) {
        console.error('Loglar getirilirken hata:', error);
        res.status(500).json({ error: "Loglar getirilemedi." });
    }
};

module.exports = { getProjects, createProject, deleteProject, getProjectBoard, getProjectLogs };