import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '../api/axios';

// Akıllı Depolama Adaptörü:
// - "Oturumumu açık tut" (remember_me === 'true') seçilmişse: localStorage
// - Seçilmemişse: sessionStorage (tarayıcı/sekme kapatılınca oturum otomatik biter)
const customAuthStorage = {
  getItem: (name) => {
    // 1. Önce aktif tarayıcı sekmesi oturumuna bak
    if (typeof sessionStorage !== 'undefined') {
      const sessionVal = sessionStorage.getItem(name);
      if (sessionVal) return sessionVal;
    }

    // 2. Eğer sessionStorage'da yoksa ve kullanıcı "Oturumumu açık tut" dediyse localStorage'a bak
    if (typeof localStorage !== 'undefined') {
      const isRemember = localStorage.getItem('remember_me') === 'true';
      if (isRemember) {
        return localStorage.getItem(name);
      }
      // "Oturumumu açık tut" seçilmediyse eski kalıntıları temizle
      localStorage.removeItem(name);
      localStorage.removeItem('token');
    }

    return null;
  },
  setItem: (name, value) => {
    const isRemember = typeof localStorage !== 'undefined' && localStorage.getItem('remember_me') === 'true';
    if (isRemember) {
      if (typeof localStorage !== 'undefined') localStorage.setItem(name, value);
      if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(name);
    } else {
      if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(name, value);
      if (typeof localStorage !== 'undefined') localStorage.removeItem(name);
    }
  },
  removeItem: (name) => {
    if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(name);
    if (typeof localStorage !== 'undefined') localStorage.removeItem(name);
  }
};

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      rememberMe: false,
      
      // Giriş yapıldığında token'ı kaydet ve state'i güncelle
      login: (user, token, rememberMe = false) => {
        if (rememberMe) {
          localStorage.setItem('remember_me', 'true');
          localStorage.setItem('token', token);
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('auth-storage');
        } else {
          localStorage.setItem('remember_me', 'false');
          localStorage.removeItem('token');
          localStorage.removeItem('auth-storage');
          sessionStorage.setItem('token', token);
        }
        set({ token, user, rememberMe });
      },
      
      // Çıkış yapıldığında verileri temizle
      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('auth-storage');
        localStorage.removeItem('remember_me');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('auth-storage');
        sessionStorage.removeItem('remember_me');
        delete api.defaults.headers.common['Authorization'];
        set({ token: null, user: null, rememberMe: false });
      },

      // Sunucudan mevcut kullanıcı bilgilerini çek
      fetchUser: async () => {
        try {
          const response = await api.get('/auth/me');
          const user = response.data;
          set({ user });
          return user;
        } catch (error) {
          console.error('Kullanıcı bilgisi alınamadı:', error);
          return null;
        }
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => customAuthStorage),
      partialize: (state) => ({ user: state.user, token: state.token, rememberMe: state.rememberMe }),
    }
  )
);

export default useAuthStore;
