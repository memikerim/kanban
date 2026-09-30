const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Güvenlik paketlerini içeri aktarma
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// HTTP güvenlik başlıklarını aktif et
app.use(helmet());

// Rate Limiter: Aynı IP'den 15 dakika içinde en fazla 100 istek atılmasına izin ver
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100, // Limit
  message: "Bu IP adresinden çok fazla istek yapıldı, lütfen daha sonra tekrar deneyin."
});
app.use(limiter);

// Mevcut Middleware'ler (Ara yazılımlar)
app.use(cors());
app.use(express.json());

// Rotaları İçeri Aktarma
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

// API Rotaları
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

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

// Sunucuyu Başlatma
app.listen(PORT, () => {
    console.log(`Sunucu http://localhost:${PORT} portunda başlatıldı.`);
});