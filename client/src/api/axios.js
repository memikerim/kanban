import axios from 'axios';

const api = axios.create({
  // Electron (masaüstü) uygulamasının ve lokal geliştirme ortamının
  // doğrudan canlı sunucuya bağlanması için tam URL kullanıyoruz.
  baseURL: 'https://kanban-t778.onrender.com/api', 
});

// ZORUNLU GÜVENLİK (INTERCEPTOR): Her API isteğinden önce araya gir ve token'ı ekle
api.interceptors.request.use((config) => {
  // 1. Önce aktif tarayıcı sekmesi oturumuna (sessionStorage) bak
  let token = sessionStorage.getItem('token');
  
  if (!token) {
    const sessionAuth = sessionStorage.getItem('auth-storage');
    if (sessionAuth) {
      try {
        const parsed = JSON.parse(sessionAuth);
        token = parsed?.state?.token;
      } catch (e) {}
    }
  }

  // 2. Eğer sessionStorage'da yoksa ve kullanıcı "Oturumumu açık tut" seçtiyse localStorage'a bak
  if (!token && localStorage.getItem('remember_me') === 'true') {
    token = localStorage.getItem('token');
    if (!token) {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        try {
          const parsed = JSON.parse(authStorage);
          token = parsed?.state?.token;
        } catch (e) {}
      }
    }
  }

  // Token bulunduysa bunu yetki başlığı (Header) olarak ekle
  if (token && token.split('.').length === 3) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;