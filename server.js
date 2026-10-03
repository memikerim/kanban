const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http'); // YENİ
const { Server } = require('socket.io'); // YENİ
require('dotenv').config();

// Güvenlik paketlerini içeri aktarma
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// YENİ: HTTP server ve Socket.io entegrasyonu
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
  }
});

// Controller'larda (ör: taskController) io'ya erişebilmek için app içerisine kaydediyoruz
app.set('io', io);

io.on('connection', (socket) => {
    console.log('Bir kullanıcı bağlandı:', socket.id);

    // İstemciden (frontend) odaya katılma isteği geldiğinde
    socket.on('join_project', (projectId) => {
        socket.join(`project_${projectId}`);
        console.log(`Socket ${socket.id}, project_${projectId} odasına katıldı.`);
    });

    socket.on('disconnect', () => {
        console.log('Kullanıcı ayrıldı:', socket.id);
    });
});

// HTTP güvenlik başlıklarını aktif et
app.use(helmet({
  contentSecurityPolicy: false, // Localhost/Render karışıklığını önlemek için kapatılabilir veya ayarlanabilir
}));

// Rate Limiter: Aynı IP'den 15 dakika içinde en fazla 100 istek atılmasına izin ver
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100, // Limit
  message: "Bu IP adresinden çok fazla istek yapıldı, lütfen daha sonra tekrar deneyin."
});
app.use('/api', limiter); // Sadece API yollarına rate limiter uygulayalım (React uygulamasını engellememek için)

// Mevcut Middleware'ler (Ara yazılımlar)
app.use(cors());
app.use(express.json());

// Rotaları İçeri Aktarma
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const workspaceRoutes = require('./routes/workspaceRoutes');

// API Rotaları
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/workspaces', workspaceRoutes);

// Sağlık Kontrolü (Test Rotası)
app.get('/api/health', (req, res) => {
    res.json({ status: "success", message: "Trello Clone API tıkır tıkır çalışıyor 🚀" });
});

// Production'da React client'ı sun
app.use(express.static(path.join(__dirname, 'client', 'dist')));

// API dışındaki tüm istekleri React'e yönlendir (SPA catch-all)
app.get('{*path}', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
});

// Sunucuyu Başlatma (app.listen YERİNE server.listen)
server.listen(PORT, () => {
    console.log(`Sunucu http://localhost:${PORT} portunda başlatıldı (Socket.io entegre edildi).`);
});