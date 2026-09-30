import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/axios';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      
      // Giriş yapıldığında token'ı kaydet ve state'i güncelle
      login: (user, token) => {
        localStorage.setItem('token', token);
        set({ token, user });
      },
      
      // Çıkış yapıldığında verileri temizle
      logout: () => {
        localStorage.removeItem('token');
        set({ token: null, user: null });
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
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);

export default useAuthStore;
