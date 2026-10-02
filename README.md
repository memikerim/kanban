# 🚀 Kanban Workspace Desktop App (Trello Clone)

Tam yığın (Full-Stack) mimari ile geliştirilmiş, bulut tabanlı, güvenli ve "Multi-tenant" (Çoklu Kiracı/Çalışma Alanı) yapısına sahip masaüstü proje yönetim uygulaması. 

Kullanıcılar şifre korumalı çalışma alanları (Workspaces) oluşturabilir, ekiplere katılabilir ve Kanban metodolojisiyle görevlerini gerçek zamanlı olarak yönetebilirler.

## 🛠️ Teknoloji Yığını (Tech Stack)

- **Masaüstü İstemci:** Electron.js, HTML/CSS/JS, Axios
- **Backend API:** Node.js, Express.js
- **Veritabanı & ORM:** PostgreSQL, Prisma ORM
- **Güvenlik:** JSON Web Token (JWT), Bcrypt.js, Express-Rate-Limit, Helmet
- **Bulut Altyapısı (Deploy):** Render.com (API Servisi), Neon.tech (PostgreSQL)

## ✨ Temel Özellikler

- **🏢 Çalışma Alanı (Workspace) Mimarisi:** 
  * Şifre korumalı yeni çalışma alanları oluşturma.
  * Çalışma alanı ID'si ve şifresi ile mevcut ekiplere katılma.
  * Admin (Yönetici) yetkisiyle çalışma alanından üye çıkarma (Kick) yönetimi.
- **📋 Gelişmiş Kanban Panosu:** Çalışma alanlarına özel projeler oluşturma ve görevleri (Task) sürükle-bırak mantığıyla kolonlar arasında taşıma.
- **🔒 Üst Düzey Güvenlik:** 
  * Şifrelerin veritabanında kırılamaz şekilde (Bcrypt ile) tutulması.
  * Kaba kuvvet (Brute-Force) saldırılarına karşı `express-rate-limit` ile API istek sınırlandırması.
  * `helmet` ile HTTP başlık güvenliği.
  * JWT tabanlı güvenli oturum yönetimi.
- **☁️ Bulut Entegrasyonu:** Masaüstü istemci, arka planda Render.com üzerinde çalışan API ile haberleşir; veriler Neon.tech PostgreSQL sunucularında güvenle saklanır.
- **💻 Bağımsız Masaüstü Deneyimi:** Kurulum veya terminal bilgisi gerektirmeyen, doğrudan çalıştırılabilir `.exe` formatı.

> 💡 **Not:** Ücretsiz bulut sunucu (Render) kullanıldığı için, uzun süreli inaktif durumların ardından uygulamanın ilk açılışı (sunucunun başlatılması) 30-40 saniye sürebilir.

---

## 🏗️ Proje Geliştirme Aşamaları

Bu proje, sıfırdan canlıya alınma sürecine kadar net bir mühendislik planı çerçevesinde aşağıdaki aşamalarla geliştirilmiştir:

1. **Veritabanı Mimarisi:** PostgreSQL ve Prisma ORM kullanılarak ilişkisel veritabanı (Kullanıcı, Çalışma Alanı, Proje, Görev vb.) şemalarının tasarlanması ve buluta taşınması.
2. **Backend API Geliştirme:** Node.js ve Express.js ile iş mantığının kurulması ve RESTful API uç noktalarının (CRUD işlemleri) oluşturulması.
3. **Masaüstü Arayüz Entegrasyonu:** Electron.js kullanılarak web teknolojilerinin masaüstü ortamına entegre edilmesi ve API ile haberleştirilmesi (Axios).
4. **Güvenlik Katmanı:** Bcrypt ile şifre kriptolama, JWT ile yetkilendirme, `helmet` ile HTTP koruması ve `express-rate-limit` ile kaba kuvvet (brute-force) saldırı korumasının uygulanması.
5. **Bulut Entegrasyonu (Deploy):** Yerel veritabanının Neon.tech'e, backend sunucusunun ise Render.com'a taşınarak uygulamanın tamamen internete açılması.
6. **Uygulama Paketleme (Build):** Electron kullanılarak projenin son kullanıcılar için bağımsız çalışabilen bir Windows `.exe` dosyası formatına dönüştürülmesi.

---

## 📦 Kurulum ve Çalıştırma (Geliştiriciler İçin)

Projeyi kendi ortamınızda geliştirmek veya incelemek isterseniz aşağıdaki adımları takip edebilirsiniz.

### 1. Depoyu Klonlayın
```bash
git clone https://github.com/memikerim/kanban.git
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
Ana dizinde bir `.env` dosyası oluşturun ve aşağıdaki şablonu kendi bilgilerinizle doldurun:
```env
DATABASE_URL="postgresql://kullanici:sifre@sunucu_adresi/veritabani_adi?sslmode=require"
JWT_SECRET="kendi_gizli_anahtarinizi_belirleyin"
PORT=3000
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
