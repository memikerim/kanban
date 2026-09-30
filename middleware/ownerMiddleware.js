const ownerMiddleware = (req, res, next) => {
  // authMiddleware'den geçen req.user içindeki role bilgisini kontrol et
  if (req.user && req.user.role === 'owner') {
    next(); // Kullanıcı owner ise işlemi yapmasına izin ver
  } else {
    // Owner değilse 403 (Yasak) hatası döndür
    res.status(403).json({ error: "Bu işlem için 'Sahip' (Owner) yetkisine sahip olmalısınız." });
  }
};

module.exports = ownerMiddleware;
