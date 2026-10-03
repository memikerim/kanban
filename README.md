# 🚀 Kanban Workspace Desktop App (Trello Clone)

Tam yığın (Full-Stack) mimari ile geliştirilmiş, bulut tabanlı, gerçek zamanlı (real-time) senkronizasyona ve "Multi-tenant" (Çoklu Kiracı/Çalışma Alanı) yapısına sahip masaüstü proje yönetim uygulaması. 

Kullanıcılar şifre korumalı çalışma alanları oluşturabilir, ekiplere katılabilir, görevlerine dosya/görsel ekleyebilir ve Kanban metodolojisiyle kartlarını yönetirken tüm takım arkadaşlarının ekranında anlık olarak senkronize olabilirler.

## 🛠️ Teknoloji Yığını (Tech Stack)

- **Masaüstü İstemci:** Electron.js, HTML/CSS/JS, Axios, Socket.io-client
- **Backend API:** Node.js, Express.js, Socket.io
- **Veritabanı & ORM:** PostgreSQL, Prisma ORM
- **Bulut Dosya Yönetimi:** Cloudinary, Multer
- **Güvenlik:** JSON Web Token (JWT), Bcrypt.js, Express-Rate-Limit, Helmet
- **Bulut Altyapısı (Deploy):** Render.com (API Servisi), Neon.tech (PostgreSQL)

## ✨ Temel Özellikler

- **⚡ Gerçek Zamanlı (Real-Time) Senkronizasyon:** Socket.io entegrasyonu sayesinde, bir ekip üyesi görev kartını başka bir kolona taşıdığında veya güncellediğinde, aynı çalışma alanındaki diğer tüm üyelerin ekranı anında (sayfa yenilenmeden) güncellenir.
- **📎 Bulut Tabanlı Dosya Yükleme:** Görev (Task) detaylarına Cloudinary ve Multer altyapısı kullanılarak resim ve dosya (attachment) eklenebilir.
- **🏢 Çalışma Alanı (Workspace) Mimarisi:** 
  * Şifre korumalı yeni çalışma alanları oluşturma.
  * ID ve şifre ile mevcut ekiplere katılma.
  * Admin (Yönetici) yetkisiyle çalışma alanından üye çıkarma (Kick) yönetimi.
- **📋 Gelişmiş Kanban Panosu:** Sürükle-bırak mantığıyla çalışan dinamik proje ve görev yönetimi.
- **🔒 Üst Düzey Güvenlik:** Bcrypt şifreleme, Brute-Force koruması (`express-rate-limit`), HTTP başlık güvenliği (`helmet`) ve JWT tabanlı güvenli oturum yönetimi.
- **💻 Bağımsız Masaüstü Deneyimi:** Kurulum veya terminal bilgisi gerektirmeyen, doğrudan çalıştırılabilir `.exe` formatı.

> 💡 **Not:** Ücretsiz bulut sunucu (Render) kullanıldığı için, uzun süreli inaktif durumların ardından uygulamanın ilk açılışı (sunucunun baştan başlatılması) 30-40 saniye sürebilir.

---

## 🏗️ Proje Geliştirme Aşamaları

Bu proje, sıfırdan canlıya alınma sürecine kadar net bir mühendislik planı çerçevesinde aşağıdaki aşamalarla geliştirilmiştir:

1. **Veritabanı Mimarisi:** PostgreSQL ve Prisma ORM ile ilişkisel veritabanı şemalarının (Kullanıcı, Workspace, Proje, Görev, Eklenti) tasarlanması.
2. **Backend API Geliştirme:** Node.js ve Express.js ile RESTful API uç noktalarının oluşturulması.
3. **Masaüstü Arayüz Entegrasyonu:** Electron.js ile web teknolojilerinin bağımsız bir masaüstü yazılımına dönüştürülmesi.
4. **Güvenlik Katmanı:** Bcrypt, JWT, Helmet ve Rate-Limit ile sistem güvenliğinin sağlanması.
5. **Bulut Entegrasyonu (Deploy):** Veritabanının Neon.tech'e, backend'in Render.com'a taşınması.
6. **Gerçek Zamanlı İletişim:** Socket.io entegrasyonu ile workspace (oda) bazlı anlık veri senkronizasyonunun kurulması.
7. **Dosya Yönetimi:** Multer ve Cloudinary API kullanılarak sisteme güvenli dosya/medya yükleme özelliğinin eklenmesi.
8. **Uygulama Paketleme (Build):** Electron kullanılarak uygulamanın son kullanıcılar için Windows `.exe` dosyası formatında derlenmesi.

---

## 📦 Kurulum ve Çalıştırma (Geliştiriciler İçin)

Projeyi kendi ortamınızda geliştirmek veya incelemek isterseniz aşağıdaki adımları takip edebilirsiniz.

### 1. Depoyu Klonlayın
```bash
git clone [https://github.com/memikerim/kanban.git](https://github.com/memikerim/kanban.git)
cd kanban
```

### 2. Bağımlılıkları Yükleyin
Hem backend hem de frontend bağımlılıklarını kurun:
```bash
npm install
cd client && npm install
cd ..
```

### 3. Çevresel Değişkenleri (.env) Ayarlayın
Ana dizinde bir `.env` dosyası oluşturun ve aşağıdaki şablonu kendi bilgilerinizle doldurun (Veritabanı için Neon.tech, Dosya yükleme için Cloudinary kullanılmaktadır):
```env
# Veritabanı Ayarları
DATABASE_URL="postgresql://kullanici:sifre@sunucu_adresi/veritabani_adi?sslmode=require"

# Güvenlik Ayarları
JWT_SECRET="kendi_gizli_anahtarinizi_belirleyin"
PORT=3000

# Dosya Yükleme Ayarları (Cloudinary)
CLOUDINARY_CLOUD_NAME="cloud_adiniz"
CLOUDINARY_API_KEY="api_anahtariniz"
CLOUDINARY_API_SECRET="api_gizli_anahtariniz"
```

### 4. Veritabanını Senkronize Edin
Prisma kullanarak veritabanı tablolarınızı oluşturun:
```bash
npx prisma db push
```

### 5. Projeyi Başlatın
**Backend Sunucusunu Başlatmak İçin:**
```bash
npm start
```

**Masaüstü Uygulamasını (Geliştirici Modunda) Başlatmak İçin:**
Yeni bir terminal sekmesi açın ve istemci klasöründe başlatın:
```bash
cd client
npm start
```

### 6. Masaüstü Uygulamasını Paketleme (Build)
Uygulamayı dağıtıma hazır bir `.exe` dosyası haline getirmek için istemci klasöründeyken şu komutu çalıştırın:
```bash
npm run pack-app
```
*(Çıktı dosyası `client/release` klasörünün içinde oluşturulacaktır.)*

---

## 🚀 İndir ve Hemen Kullan (Son Kullanıcılar İçin)

Herhangi bir kod indirmeden veya kurulum yapmadan projeyi doğrudan denemek için yayınlanmış son sürümü indirebilirsiniz:

👉 **[Güncel .exe Dosyasını İndirmek İçin Tıklayın (Releases)](https://github.com/memikerim/kanban/releases)**
