import React, { useState } from 'react';

export default function TourModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('projects_diff');
  const [dontShowAgain, setDontShowAgain] = useState(
    localStorage.getItem('hide_onboarding_tour') === 'true'
  );

  // --- İNTERAKTİF SİMÜLASYON DURUMU (Gerçek veritabanını etkilemez) ---
  const [demoTasks, setDemoTasks] = useState([
    { id: 1, title: '🚀 Yeni projeyi incele', col: 'todo', color: '#0052cc', desc: 'Kart detayında renk ve açıklama düzenleyebilirsiniz.', date: '2026-10-15', hasFile: true },
    { id: 2, title: '🎨 Tasarım revizyonu yap', col: 'inprogress', color: '#ffab00', desc: 'Devam eden aşamadaki örnek görev.', date: '2026-10-12', hasFile: false },
    { id: 3, title: '✅ Ekibi çalışma alanına davet et', col: 'done', color: '#36b37e', desc: 'Davet kodunu kullanarak ekip arkadaşlarını ekledik.', date: '2026-10-09', hasFile: true }
  ]);
  const [demoNewText, setDemoNewText] = useState('');
  const [demoSelectedTask, setDemoSelectedTask] = useState(null);

  if (!isOpen) return null;

  const tabs = [
    { id: 'projects_diff', label: '🏢 Projeler: Kişisel vs. Alan', icon: '🏢' },
    { id: 'workspace_guide', label: '👥 Çalışma Alanı & Üyeler', icon: '👥' },
    { id: 'tasks_guide', label: '📋 Görevler & Kanban Panosu', icon: '📋' },
    { id: 'account_guide', label: '⚙️ Hesap Yönetimi & Güvenlik', icon: '⚙️' },
    { id: 'interactive_demo', label: '🎮 Etkileşimli Simülasyon', icon: '🎯' },
  ];

  const currentTabIndex = tabs.findIndex(t => t.id === activeTab);

  const handleNext = () => {
    if (currentTabIndex < tabs.length - 1) {
      setActiveTab(tabs[currentTabIndex + 1].id);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentTabIndex > 0) {
      setActiveTab(tabs[currentTabIndex - 1].id);
    }
  };

  const handleCheckboxChange = (e) => {
    const checked = e.target.checked;
    setDontShowAgain(checked);
    if (checked) {
      localStorage.setItem('hide_onboarding_tour', 'true');
    } else {
      localStorage.removeItem('hide_onboarding_tour');
    }
  };

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('hide_onboarding_tour', 'true');
    }
    onClose();
  };

  // Simülasyon Fonksiyonları
  const handleAddDemoTask = () => {
    if (!demoNewText.trim()) return;
    const newTask = {
      id: Date.now(),
      title: demoNewText.trim(),
      col: 'todo',
      color: '#0052cc',
      desc: 'Simülasyonda oluşturuldu (Kaydedilmez).',
      date: '',
      hasFile: false
    };
    setDemoTasks([...demoTasks, newTask]);
    setDemoNewText('');
  };

  const handleMoveDemoTask = (id, targetCol) => {
    setDemoTasks(demoTasks.map(t => t.id === id ? { ...t, col: targetCol } : t));
  };

  const handleDeleteDemoTask = (id) => {
    setDemoTasks(demoTasks.filter(t => t.id !== id));
    if (demoSelectedTask?.id === id) setDemoSelectedTask(null);
  };

  const handleResetDemo = () => {
    setDemoTasks([
      { id: 1, title: '🚀 Yeni projeyi incele', col: 'todo', color: '#0052cc', desc: 'Kart detayında renk ve açıklama düzenleyebilirsiniz.', date: '2026-10-15', hasFile: true },
      { id: 2, title: '🎨 Tasarım revizyonu yap', col: 'inprogress', color: '#ffab00', desc: 'Devam eden aşamadaki örnek görev.', date: '2026-10-12', hasFile: false },
      { id: 3, title: '✅ Ekibi çalışma alanına davet et', col: 'done', color: '#36b37e', desc: 'Davet kodunu kullanarak ekip arkadaşlarını ekledik.', date: '2026-10-09', hasFile: true }
    ]);
    setDemoSelectedTask(null);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(9, 30, 66, 0.75)', backdropFilter: 'blur(4px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 10000, padding: '16px'
    }}>
      <div style={{
        background: '#ffffff', borderRadius: '12px',
        width: '100%', maxWidth: '920px', maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        overflow: 'hidden', border: '1px solid #dfe1e6'
      }}>

        {/* --- BAŞLIK (HEADER) --- */}
        <div style={{
          padding: '16px 24px', background: 'linear-gradient(135deg, #0052cc, #0747a6)',
          color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>🧭</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Kanban Uygulama Rehberi & Hızlı Tur</h3>
              <p style={{ margin: 0, fontSize: '12px', opacity: 0.9 }}>Tüm özellikleri ve kullanım inceliklerini keşfedin</p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            title="Kapat"
            style={{
              background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
              width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer',
              fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 'bold', transition: '0.2s'
            }}
          >
            ✕
          </button>
        </div>

        {/* --- İÇERİK GÖVDESİ (YAN MENÜ + İÇERİK ALANI) --- */}
        <div style={{ display: 'flex', flex: 1, minHeight: '380px', overflow: 'hidden', flexDirection: 'row' }} className="tour-modal-body">
          
          {/* SOL SEKMELER (Masaüstünde dikey, Mobilde yatay) */}
          <div style={{
            width: '240px', background: '#f4f5f7', borderRight: '1px solid #ebecf0',
            padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px',
            overflowY: 'auto'
          }} className="tour-tabs-sidebar">
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#6b778c', textTransform: 'uppercase', padding: '4px 8px', letterSpacing: '0.5px' }}>
              Rehber Konuları ({currentTabIndex + 1}/{tabs.length})
            </span>
            {tabs.map((tab, idx) => {
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 12px', borderRadius: '6px', border: 'none',
                    textAlign: 'left', cursor: 'pointer', fontSize: '13px',
                    fontWeight: isActive ? 'bold' : '500',
                    background: isActive ? '#0052cc' : 'transparent',
                    color: isActive ? '#ffffff' : '#172b4d',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ fontSize: '16px' }}>{tab.icon}</span>
                  <span style={{ flex: 1 }}>{tab.label.replace(/^.*? /, '')}</span>
                  {isActive && <span style={{ fontSize: '12px' }}>●</span>}
                </button>
              );
            })}

            {/* Simülasyona Hızlı Atla Kutusu */}
            <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #dfe1e6' }}>
              <button
                onClick={() => setActiveTab('interactive_demo')}
                style={{
                  width: '100%', padding: '8px 10px', background: '#e3fcef',
                  color: '#006644', border: '1px dashed #36b37e', borderRadius: '6px',
                  fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center'
                }}
              >
                🎮 Canlı Simülasyonu Dene
              </button>
            </div>
          </div>

          {/* SAĞ İÇERİK ALANI */}
          <div style={{ flex: 1, padding: '24px', overflowY: 'auto', background: '#ffffff' }}>
            
            {/* 1. SEKMEYE ÖZEL İÇERİK: KİŞİSEL VS ALAN PROJELERİ */}
            {activeTab === 'projects_diff' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <span style={{ fontSize: '20px' }}>🏢</span>
                  <h4 style={{ margin: 0, fontSize: '18px', color: '#172b4d' }}>Kişisel Projeler ve Alan Projeleri Arasındaki Farklar</h4>
                </div>
                <p style={{ color: '#5e6c84', fontSize: '14px', lineHeight: '1.5', marginBottom: '20px' }}>
                  Uygulamamızda projeler iki ana kategoriye ayrılır. İhtiyacınıza göre projelerinizi sadece kendinize özel tutabilir veya ekip arkadaşlarınızla anlık ortak çalışabilirsiniz:
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                  
                  {/* Kişisel Projeler Kartı */}
                  <div style={{ background: '#f4f5f7', borderRadius: '8px', padding: '16px', border: '2px solid #dfe1e6' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <span style={{ background: '#0052cc', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>🔒 KİŞİSEL</span>
                      <strong style={{ color: '#172b4d', fontSize: '15px' }}>Kişisel Projelerim</strong>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#344563', lineHeight: '1.6' }}>
                      <li><strong>Sadece Size Özel:</strong> Hiçbir çalışma alanı üyesi bu projeleri göremez veya müdahale edemez.</li>
                      <li><strong>Bireysel Takip:</strong> Kişisel yapılacak işleriniz, çalışma notlarınız ve gizli planlarınız için tasarlanmıştır.</li>
                      <li><strong>Erişim Yolu:</strong> Sol menüdeki <em>"Kişisel Projelerim"</em> listesinde yer alır.</li>
                    </ul>
                  </div>

                  {/* Alan Projeleri Kartı */}
                  <div style={{ background: '#ebf8ff', borderRadius: '8px', padding: '16px', border: '2px solid #0052cc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <span style={{ background: '#36b37e', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>🌐 EKİP / TAKIM</span>
                      <strong style={{ color: '#0052cc', fontSize: '15px' }}>Çalışma Alanı Projeleri</strong>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#0747a6', lineHeight: '1.6' }}>
                      <li><strong>Ortak & Canlı:</strong> O çalışma alanına (Workspace) üye olan herkes projeyi görebilir ve yönetebilir.</li>
                      <li><strong>Anlık (Socket.io) Senkron:</strong> Birisi kart eklediğinde, taşıdığında veya sildiğinde herkesin ekranı sayfayı yenilemeden güncellenir.</li>
                      <li><strong>Erişim Yolu:</strong> Sol menüden bir çalışma alanı seçildiğinde <em>"Alan Projeleri"</em> altında listelenir.</li>
                    </ul>
                  </div>

                </div>

                <div style={{ background: '#fff0b3', border: '1px solid #ffe380', padding: '12px 16px', borderRadius: '6px', fontSize: '13px', color: '#172b4d', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '18px' }}>💡</span>
                  <span><strong>İpucu:</strong> Bir çalışma alanındayken istediğiniz zaman sol menüdeki <strong>"← Kişisel"</strong> butonuna basarak kendi özel projelerinize geri dönebilirsiniz.</span>
                </div>
              </div>
            )}

            {/* 2. SEKMEYE ÖZEL İÇERİK: ÇALIŞMA ALANI & ÜYELER */}
            {activeTab === 'workspace_guide' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <span style={{ fontSize: '20px' }}>👥</span>
                  <h4 style={{ margin: 0, fontSize: '18px', color: '#172b4d' }}>Çalışma Alanı (Workspace) & Üye Yönetimi</h4>
                </div>
                <p style={{ color: '#5e6c84', fontSize: '14px', lineHeight: '1.5', marginBottom: '18px' }}>
                  Çalışma alanları, takımların projeleri ve görevleri bir arada yürüttüğü ortak ofislerdir. Alan oluşturabilir, davet kodu ile katılabilir veya ekibinizi davet edebilirsiniz:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  
                  {/* Adım 1: Yeni Alan Oluşturma */}
                  <div style={{ display: 'flex', gap: '14px', background: '#fafbfc', padding: '14px', borderRadius: '8px', border: '1px solid #ebecf0' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#0052cc', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>1</div>
                    <div>
                      <strong style={{ fontSize: '14px', color: '#172b4d' }}>Yeni Çalışma Alanı Nasıl Oluşturulur?</strong>
                      <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#5e6c84', lineHeight: '1.5' }}>
                        Sol menüdeki <strong>"+ Yeni Alan / Alana Katıl"</strong> butonuna tıklayın. Açılan pencerede <em>"Yeni Alan Oluştur"</em> sekmesini seçip bir <strong>Alan Adı</strong> ve en az 4 haneli bir <strong>Şifre</strong> belirleyin. Alanı oluşturan kişi otomatik olarak <strong>ADMIN</strong> yetkisine sahip olur.
                      </p>
                    </div>
                  </div>

                  {/* Adım 2: Alana Arkadaşını Davet Etme */}
                  <div style={{ display: 'flex', gap: '14px', background: '#fafbfc', padding: '14px', borderRadius: '8px', border: '1px solid #ebecf0' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#6554c0', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>2</div>
                    <div>
                      <strong style={{ fontSize: '14px', color: '#172b4d' }}>Alana Yeni Birisi Nasıl Eklenir / Davet Edilir?</strong>
                      <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#5e6c84', lineHeight: '1.5' }}>
                        Oluşturulan her alanın yanında 8 haneli benzersiz bir <strong>Davet Kodu (Örn: A3F2B1C9 📋)</strong> bulunur. Bu koda tıklayarak anında kopyalayabilirsiniz. Arkadaşınıza bu <strong>Davet Kodunu</strong> ve alanı oluştururken belirlediğiniz <strong>Şifreyi</strong> iletmeniz yeterlidir.
                      </p>
                    </div>
                  </div>

                  {/* Adım 3: Var Olan Alana Katılma */}
                  <div style={{ display: 'flex', gap: '14px', background: '#fafbfc', padding: '14px', borderRadius: '8px', border: '1px solid #ebecf0' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#00875a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>3</div>
                    <div>
                      <strong style={{ fontSize: '14px', color: '#172b4d' }}>Var Olan Bir Alana Nasıl Katılınır?</strong>
                      <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#5e6c84', lineHeight: '1.5' }}>
                        Sol menüdeki <strong>"+ Yeni Alan / Alana Katıl"</strong> butonuna basın ve <em>"Alana Katıl"</em> sekmesine geçin. Arkadaşınızdan aldığınız 8 haneli davet kodunu ve alan şifresini yazıp <strong>"Katıl"</strong> butonuna tıklayın. Alan anında listenize eklenecektir!
                      </p>
                    </div>
                  </div>

                  {/* Adım 4: Üyeleri Görüntüleme & Çıkarma */}
                  <div style={{ display: 'flex', gap: '14px', background: '#fafbfc', padding: '14px', borderRadius: '8px', border: '1px solid #ebecf0' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ff5630', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>4</div>
                    <div>
                      <strong style={{ fontSize: '14px', color: '#172b4d' }}>Üye Yönetimi & Üye Çıkarma</strong>
                      <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#5e6c84', lineHeight: '1.5' }}>
                        Her alanın altındaki <strong>"👥 Üyeler"</strong> butonuna basarak alanda kimlerin olduğunu ve rollerini görebilirsiniz. Eğer o alanın <strong>Admin</strong>'i sizseniz, alandan çıkarmak istediğiniz kişilerin yanındaki <strong>"Çıkar"</strong> butonuyla yetkisiz kişileri alandan uzaklaştırabilirsiniz.
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* 3. SEKMEYE ÖZEL İÇERİK: GÖREVLER & KANBAN PANOSU */}
            {activeTab === 'tasks_guide' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <span style={{ fontSize: '20px' }}>📋</span>
                  <h4 style={{ margin: 0, fontSize: '18px', color: '#172b4d' }}>Proje Görevleri & Kanban Panosu İşleyişi</h4>
                </div>
                <p style={{ color: '#5e6c84', fontSize: '14px', lineHeight: '1.5', marginBottom: '18px' }}>
                  Bir projeye tıkladığınızda karşınıza gelen Kanban panosu, işlerinizi adım adım takip etmenizi sağlar:
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                  
                  <div style={{ background: '#f4f5f7', padding: '14px', borderRadius: '8px', borderLeft: '4px solid #0052cc' }}>
                    <h5 style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#172b4d' }}>1. Sürükle & Bırak (Drag and Drop)</h5>
                    <p style={{ margin: 0, fontSize: '13px', color: '#5e6c84', lineHeight: '1.5' }}>
                      Kartları fare ile veya mobilde dokunarak <em>"Yapılacaklar"</em>, <em>"Devam Edenler"</em> ve <em>"Tamamlandı"</em> kolonları arasında taşıyabilirsiniz. Sıralama anında veritabanına işlenir.
                    </p>
                  </div>

                  <div style={{ background: '#f4f5f7', padding: '14px', borderRadius: '8px', borderLeft: '4px solid #36b37e' }}>
                    <h5 style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#172b4d' }}>2. Kart Detayı & Renk Etiketleri</h5>
                    <p style={{ margin: 0, fontSize: '13px', color: '#5e6c84', lineHeight: '1.5' }}>
                      Herhangi bir karta tıklayarak detay penceresini açabilirsiniz. Karta renk paletinden <strong>renk etiketi</strong> verebilir, detaylı <strong>açıklama</strong> ekleyebilir ve <strong>son teslim tarihi (Due Date)</strong> belirleyebilirsiniz.
                    </p>
                  </div>

                  <div style={{ background: '#f4f5f7', padding: '14px', borderRadius: '8px', borderLeft: '4px solid #ffab00' }}>
                    <h5 style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#172b4d' }}>3. Resim & Belge Yükleme (Cloudinary)</h5>
                    <p style={{ margin: 0, fontSize: '13px', color: '#5e6c84', lineHeight: '1.5' }}>
                      Kart detayındaki <strong>"📎 Dosya Yükle"</strong> butonuyla görsellerinizi veya PDF belgelerinizi yükleyebilirsiniz. Yüklenen resimler büyük önizlemeli galeri kutusunda sergilenir, PDF'ler ise tek tıkla doğrudan indirilir.
                    </p>
                  </div>

                  <div style={{ background: '#f4f5f7', padding: '14px', borderRadius: '8px', borderLeft: '4px solid #6554c0' }}>
                    <h5 style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#172b4d' }}>4. Gerçek Zamanlı Eşzamanlama (Socket.io)</h5>
                    <p style={{ margin: 0, fontSize: '13px', color: '#5e6c84', lineHeight: '1.5' }}>
                      Aynı projede birden fazla kullanıcı çalışırken biriniz kart taşıdığında veya yeni görev eklediğinde diğer herkesin ekranı otomatik olarak yenilenir.
                    </p>
                  </div>

                </div>

                <div style={{ background: '#ebf8ff', padding: '12px 16px', borderRadius: '6px', border: '1px solid #b3d4ff', fontSize: '13px', color: '#0747a6' }}>
                  🕒 <strong>Son Değişiklikler:</strong> Panonun üstündeki <em>"Son Değişiklikler"</em> butonuna basarak projede kimin ne zaman görev eklediğini, taşıdığını veya sildiğini aktivite günlüğünden takip edebilirsiniz.
                </div>
              </div>
            )}

            {/* 4. SEKMEYE ÖZEL İÇERİK: HESAP YÖNETİMİ & GÜVENLİK */}
            {activeTab === 'account_guide' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <span style={{ fontSize: '20px' }}>⚙️</span>
                  <h4 style={{ margin: 0, fontSize: '18px', color: '#172b4d' }}>Hesap Yönetimi & Güvenlik Özellikleri</h4>
                </div>
                <p style={{ color: '#5e6c84', fontSize: '14px', lineHeight: '1.5', marginBottom: '18px' }}>
                  Kullanıcı profiliniz, sistem yetkileriniz ve hesap güvenliği ile ilgili seçenekler:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '18px' }}>
                  
                  {/* Profil ve Yetkiler */}
                  <div style={{ background: '#fafbfc', padding: '16px', borderRadius: '8px', border: '1px solid #dfe1e6' }}>
                    <strong style={{ fontSize: '15px', color: '#172b4d', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      👤 Profil & Yetki Seviyeleri
                    </strong>
                    <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#5e6c84', lineHeight: '1.5' }}>
                      Sağ üstteki <strong>"⚙️ Hesabım"</strong> butonuna tıklayarak adınızı, e-postanızı ve sistemdeki rolünüzü görebilirsiniz.
                      <br />• <strong>Sistem Yöneticisi (Owner):</strong> Tüm kullanıcıları yönetebilir, yeni yönetici atayabilir veya hesapları silebilir.
                      <br />• <strong>Admin / Kullanıcı:</strong> Normal pano ve alan yönetimi yapabilir.
                    </p>
                  </div>

                  {/* Hesabı Kalıcı Olarak Silme */}
                  <div style={{ background: '#ffebe6', padding: '16px', borderRadius: '8px', border: '1px solid #ffbdad' }}>
                    <strong style={{ fontSize: '15px', color: '#bf2600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      🗑️ Hesabı Kalıcı Olarak Silme Seçeneği
                    </strong>
                    <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#a51d24', lineHeight: '1.5' }}>
                      Kendi hesabınızı kalıcı olarak silmek isterseniz:
                      <br />1. Sağ üstteki <strong>"⚙️ Hesabım"</strong> butonuna basın.
                      <br />2. Pencerenin altındaki kırmızı <strong>"Hesabımı Sil"</strong> alanını açın.
                      <br />3. Güvenliğiniz için mevcut şifrenizi girip onaylayın.
                      <br /><strong>Dikkat:</strong> Bu işlem geri alınamaz; kişisel projeleriniz ve tüm verileriniz kalıcı olarak silinir!
                    </p>
                  </div>

                  {/* Oturumu Açık Tut Güvenliği */}
                  <div style={{ background: '#e3fcef', padding: '16px', borderRadius: '8px', border: '1px solid #abf5d1' }}>
                    <strong style={{ fontSize: '15px', color: '#006644', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      🔒 "Oturumumu Açık Tut" Güvenlik Özelliği
                    </strong>
                    <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#006644', lineHeight: '1.5' }}>
                      Giriş yaparken <em>"Oturumumu açık tut"</em> kutusunu işaretlemezseniz, güvenlik amacıyla tarayıcınızı veya sekmeyi kapattığınız anda oturumunuz otomatik olarak sonlanır. Ortak kullanılan veya halka açık bilgisayarlarda kutuyu boş bırakmanız önerilir.
                    </p>
                  </div>

                </div>
              </div>
            )}

            {/* 5. SEKMEYE ÖZEL İÇERİK: ETKİLEŞİMLİ SİMÜLASYON (SANDBOX) */}
            {activeTab === 'interactive_demo' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>🎯</span>
                    <h4 style={{ margin: 0, fontSize: '18px', color: '#172b4d' }}>Canlı Simülasyon Panosu</h4>
                  </div>
                  <button
                    onClick={handleResetDemo}
                    style={{
                      background: '#ebecf0', color: '#42526e', border: 'none',
                      padding: '4px 10px', borderRadius: '4px', fontSize: '12px',
                      cursor: 'pointer', fontWeight: 'bold'
                    }}
                  >
                    ↺ Simülasyonu Sıfırla
                  </button>
                </div>

                {/* Bilgilendirme Banner */}
                <div style={{
                  background: '#e3fcef', border: '1px solid #36b37e', color: '#006644',
                  padding: '8px 12px', borderRadius: '6px', fontSize: '12px', marginBottom: '14px',
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                  <span>💡</span>
                  <span><strong>Deneme Alanı:</strong> Buradaki görevleri taşıyabilir, yeni görev ekleyebilir veya silebilirsiniz. Yapılan işlemler <strong>gerçek veritabanınızı kesinlikle etkilemez</strong>.</span>
                </div>

                {/* Yeni Görev Ekleme Kutusu */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                  <input
                    type="text"
                    placeholder="Deneme görevi yazın (Örn: Raporu hazırla)..."
                    value={demoNewText}
                    onChange={(e) => setDemoNewText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddDemoTask()}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid #dfe1e6', fontSize: '13px' }}
                  />
                  <button
                    onClick={handleAddDemoTask}
                    style={{
                      padding: '8px 16px', background: '#0052cc', color: 'white',
                      border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer'
                    }}
                  >
                    + Görev Ekle
                  </button>
                </div>

                {/* Mini Kanban Kolonları */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px', marginBottom: '14px' }}>
                  
                  {/* Kolon: Yapılacaklar */}
                  <div style={{ background: '#ebecf0', borderRadius: '6px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold', fontSize: '13px', color: '#172b4d' }}>
                      <span>Yapılacaklar</span>
                      <span style={{ background: '#dfe1e6', padding: '2px 6px', borderRadius: '10px', fontSize: '11px' }}>
                        {demoTasks.filter(t => t.col === 'todo').length}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '100px' }}>
                      {demoTasks.filter(t => t.col === 'todo').map(task => (
                        <div
                          key={task.id}
                          onClick={() => setDemoSelectedTask(task)}
                          style={{
                            background: '#ffffff', padding: '10px', borderRadius: '4px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.12)', cursor: 'pointer',
                            borderLeft: `4px solid ${task.color || '#0052cc'}`,
                            display: 'flex', flexDirection: 'column', gap: '6px'
                          }}
                        >
                          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#172b4d' }}>{task.title}</span>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', color: '#5e6c84' }}>{task.hasFile ? '📎 Dosya var' : '📝 Metin'}</span>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleMoveDemoTask(task.id, 'inprogress'); }}
                                title="Devam Edenler'e taşı"
                                style={{ background: '#0052cc', color: 'white', border: 'none', borderRadius: '3px', fontSize: '11px', padding: '2px 6px', cursor: 'pointer' }}
                              >
                                ➔ Devam
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteDemoTask(task.id); }}
                                title="Sil"
                                style={{ background: '#ff5630', color: 'white', border: 'none', borderRadius: '3px', fontSize: '11px', padding: '2px 5px', cursor: 'pointer' }}
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Kolon: Devam Edenler */}
                  <div style={{ background: '#ebecf0', borderRadius: '6px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold', fontSize: '13px', color: '#172b4d' }}>
                      <span>Devam Edenler</span>
                      <span style={{ background: '#dfe1e6', padding: '2px 6px', borderRadius: '10px', fontSize: '11px' }}>
                        {demoTasks.filter(t => t.col === 'inprogress').length}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '100px' }}>
                      {demoTasks.filter(t => t.col === 'inprogress').map(task => (
                        <div
                          key={task.id}
                          onClick={() => setDemoSelectedTask(task)}
                          style={{
                            background: '#ffffff', padding: '10px', borderRadius: '4px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.12)', cursor: 'pointer',
                            borderLeft: `4px solid ${task.color || '#ffab00'}`,
                            display: 'flex', flexDirection: 'column', gap: '6px'
                          }}
                        >
                          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#172b4d' }}>{task.title}</span>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', color: '#5e6c84' }}>{task.hasFile ? '📎 Dosya var' : '📝 Metin'}</span>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleMoveDemoTask(task.id, 'todo'); }}
                                title="Geri taşı"
                                style={{ background: '#6b778c', color: 'white', border: 'none', borderRadius: '3px', fontSize: '11px', padding: '2px 5px', cursor: 'pointer' }}
                              >
                                ⬅
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleMoveDemoTask(task.id, 'done'); }}
                                title="Tamamlandı'ya taşı"
                                style={{ background: '#36b37e', color: 'white', border: 'none', borderRadius: '3px', fontSize: '11px', padding: '2px 6px', cursor: 'pointer' }}
                              >
                                ➔ Bitti
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteDemoTask(task.id); }}
                                title="Sil"
                                style={{ background: '#ff5630', color: 'white', border: 'none', borderRadius: '3px', fontSize: '11px', padding: '2px 5px', cursor: 'pointer' }}
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Kolon: Tamamlandı */}
                  <div style={{ background: '#ebecf0', borderRadius: '6px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold', fontSize: '13px', color: '#172b4d' }}>
                      <span>Tamamlandı</span>
                      <span style={{ background: '#dfe1e6', padding: '2px 6px', borderRadius: '10px', fontSize: '11px' }}>
                        {demoTasks.filter(t => t.col === 'done').length}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '100px' }}>
                      {demoTasks.filter(t => t.col === 'done').map(task => (
                        <div
                          key={task.id}
                          onClick={() => setDemoSelectedTask(task)}
                          style={{
                            background: '#ffffff', padding: '10px', borderRadius: '4px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.12)', cursor: 'pointer',
                            borderLeft: `4px solid ${task.color || '#36b37e'}`,
                            display: 'flex', flexDirection: 'column', gap: '6px'
                          }}
                        >
                          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#172b4d', textDecoration: 'line-through' }}>{task.title}</span>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', color: '#36b37e' }}>✓ Bitti</span>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleMoveDemoTask(task.id, 'inprogress'); }}
                                title="Geri al"
                                style={{ background: '#6b778c', color: 'white', border: 'none', borderRadius: '3px', fontSize: '11px', padding: '2px 5px', cursor: 'pointer' }}
                              >
                                ⬅
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteDemoTask(task.id); }}
                                title="Sil"
                                style={{ background: '#ff5630', color: 'white', border: 'none', borderRadius: '3px', fontSize: '11px', padding: '2px 5px', cursor: 'pointer' }}
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Seçilen Görev Detayı Önizleme Kutusu */}
                {demoSelectedTask && (
                  <div style={{ background: '#f4f5f7', border: '1px solid #dfe1e6', borderRadius: '6px', padding: '12px', marginTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '14px', color: '#172b4d' }}>🔎 Kart Detay Önizlemesi: {demoSelectedTask.title}</strong>
                      <button onClick={() => setDemoSelectedTask(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b778c' }}>✕ Kapat</button>
                    </div>
                    <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#5e6c84' }}><strong>Açıklama:</strong> {demoSelectedTask.desc}</p>
                    <div style={{ display: 'flex', gap: '15px', fontSize: '12px', color: '#172b4d' }}>
                      <span><strong>Etiket Rengi:</strong> <span style={{ display: 'inline-block', width: '12px', height: '12px', background: demoSelectedTask.color, borderRadius: '2px', verticalAlign: 'middle' }}></span></span>
                      <span><strong>Teslim Tarihi:</strong> {demoSelectedTask.date || 'Belirlenmedi'}</span>
                      <span><strong>Eklentiler:</strong> {demoSelectedTask.hasFile ? '1 adet dosya yüklü' : 'Dosya yok'}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* --- ALT ÇUBUK (FOOTER) --- */}
        <div style={{
          padding: '14px 24px', background: '#fafbfc', borderTop: '1px solid #ebecf0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px'
        }}>
          {/* Tekrar Gösterme Onay Kutusu */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#42526e', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={handleCheckboxChange}
              style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#0052cc' }}
            />
            <span>Bu rehberi bir daha otomatik gösterme</span>
          </label>

          {/* Navigasyon Butonları */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {currentTabIndex > 0 && (
              <button
                onClick={handlePrev}
                style={{
                  padding: '8px 16px', background: '#ebecf0', color: '#172b4d',
                  border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px'
                }}
              >
                ← Geri
              </button>
            )}

            <button
              onClick={handleNext}
              style={{
                padding: '8px 20px', background: '#0052cc', color: 'white',
                border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px'
              }}
            >
              {currentTabIndex === tabs.length - 1 ? '🎉 Tamamla ve Başla' : 'İleri →'}
            </button>

            <button
              onClick={handleClose}
              style={{
                padding: '8px 14px', background: 'transparent', color: '#6b778c',
                border: '1px solid #dfe1e6', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold'
              }}
            >
              Kapat
            </button>
          </div>
        </div>

      </div>

      {/* --- RESPONSIVE CSS STİLLERİ --- */}
      <style>{`
        @media (max-width: 768px) {
          .tour-modal-body {
            flex-direction: column !important;
          }
          .tour-tabs-sidebar {
            width: 100% !important;
            flex-direction: row !important;
            overflow-x: auto !important;
            border-right: none !important;
            border-bottom: 1px solid #ebecf0 !important;
            padding: 8px !important;
            white-space: nowrap !important;
          }
          .tour-tabs-sidebar button {
            padding: 6px 10px !important;
            font-size: 12px !important;
          }
        }
      `}</style>
    </div>
  );
}
