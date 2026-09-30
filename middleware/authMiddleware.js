const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    // İstek başlığından (header) Authorization değerini al
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ error: "Erişim reddedildi. Token gerekli." });

    try {
        // Token genellikle "Bearer <token_kodu>" şeklinde gönderilir, sırf kodu ayıklıyoruz
        const rawToken = token.startsWith('Bearer ') ? token.slice(7, token.length) : token;
        
        // Token'ın bizim sistemimize ait olup olmadığını kontrol ediyoruz
        const verified = jwt.verify(rawToken, process.env.JWT_SECRET || "super_gizli_trello_anahtari");
        
        // Token geçerliyse içindeki kullanıcı bilgisini (userId) yakalayıp yolumuza devam ediyoruz
        req.user = verified; 
        next(); 
    } catch (error) {
        res.status(400).json({ error: "Geçersiz veya süresi dolmuş token." });
    }
};

module.exports = verifyToken;