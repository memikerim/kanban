import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api', // Backend adresin
});

// ZORUNLU GÜVENLİK (INTERCEPTOR): Her API isteğinden önce araya gir ve token'ı ekle
api.interceptors.request.use((config) => {
  let token = localStorage.getItem('token');
  
  // Eğer normal localStorage'da yoksa Zustand'ın deposuna bak
  if (!token) {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      try {
        const parsed = JSON.parse(authStorage);
        token = parsed?.state?.token;
      } catch (e) {}
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