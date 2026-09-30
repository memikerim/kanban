const adminMiddleware = (req, res, next) => {
  // authMiddleware'den geçen req.user içindeki role bilgisini kontrol et
  if (req.user && req.user.role === 'admin') {
    next(); // Kullanıcı admin ise işlemi yapmasına izin ver
  } else {
    // Admin değilse 403 (Yasak) hatası döndür
    res.status(403).json({ error: "Bu işlem için Admin yetkisine sahip olmalısınız." });
  }
};

module.exports = adminMiddleware;