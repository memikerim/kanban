import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import useAuthStore from '../store/useAuthStore';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false); // Varsayılan olarak kapalı
  const [errorMessage, setErrorMessage] = useState(''); 
  
  const { isDark } = useTheme();
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage(''); 

    try {
      const response = await api.post('/auth/login', { email, password });
      
      const token = response.data.token;
      const user = response.data.user;

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
      
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      try { login(user, token, rememberMe); } catch(e) { console.log('Zustand uyarısı:', e); }
      
      navigate('/board');
    } catch (error) {
      if (error.response && error.response.data && error.response.data.error) {
        setErrorMessage(error.response.data.error); 
      } else {
        setErrorMessage("Giriş başarısız. Lütfen bilgilerinizi kontrol edin.");
      }
    }
  };

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh',
      backgroundColor: isDark ? '#090d16' : '#f8fafc', position: 'relative', padding: '16px',
      transition: 'background-color 0.2s ease'
    }}>
      {/* Tema Değiştirme Butonu */}
      <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
        <ThemeToggle />
      </div>

      <div style={{
        background: isDark ? '#1e293b' : '#ffffff',
        border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
        color: isDark ? '#f8fafc' : '#0f172a',
        padding: '36px', borderRadius: '12px',
        boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.5)' : '0 10px 25px rgba(0,0,0,0.06)',
        width: '100%', maxWidth: '380px', transition: 'all 0.2s ease'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <span style={{ fontSize: '32px' }}>📊</span>
          <h2 style={{ color: isDark ? '#f8fafc' : '#0f172a', margin: '8px 0 4px 0', fontSize: '22px', fontWeight: 'bold' }}>
            Kanban Giriş
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: isDark ? '#94a3b8' : '#64748b' }}>
            Hesabınıza giriş yaparak panolarınızı yönetin
          </p>
        </div>
        
        {errorMessage && (
          <div style={{
            backgroundColor: isDark ? '#451a1a' : '#ffebe6',
            color: isDark ? '#fca5a5' : '#bf2600',
            padding: '12px', borderRadius: '6px',
            border: `1px solid ${isDark ? '#7f1d1d' : '#ffbdad'}`,
            marginBottom: '16px', textAlign: 'center', fontSize: '13px', fontWeight: 'bold'
          }}>
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: isDark ? '#cbd5e1' : '#475569' }}>
              E-posta
            </label>
            <input 
              type="email" 
              placeholder="ornek@alanadi.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              style={{
                width: '100%', padding: '11px 12px', borderRadius: '6px',
                border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
                backgroundColor: isDark ? '#0f172a' : '#ffffff',
                color: isDark ? '#f8fafc' : '#0f172a', fontSize: '14px', outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: isDark ? '#cbd5e1' : '#475569' }}>
              Şifre
            </label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              style={{
                width: '100%', padding: '11px 12px', borderRadius: '6px',
                border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
                backgroundColor: isDark ? '#0f172a' : '#ffffff',
                color: isDark ? '#f8fafc' : '#0f172a', fontSize: '14px', outline: 'none'
              }}
            />
          </div>

          {/* Oturumumu Açık Tut Checkbox ve Şifremi Unuttum */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '2px 0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer', fontSize: '13px', color: isDark ? '#94a3b8' : '#475569', userSelect: 'none' }}>
              <input 
                type="checkbox" 
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)} 
                style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: '#0052cc' }}
              />
              <span>Oturumumu açık tut</span>
            </label>
            <Link to="/forgot-password" style={{ color: isDark ? '#60a5fa' : '#0052cc', textDecoration: 'none', fontSize: '12px', fontWeight: 'bold' }}>
              Şifremi Unuttum
            </Link>
          </div>

          <button 
            type="submit" 
            style={{
              padding: '12px', backgroundColor: '#10b981', color: 'white', border: 'none',
              borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', marginTop: '6px',
              transition: 'background-color 0.15s ease'
            }}
          >
            Giriş Yap
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: isDark ? '#94a3b8' : '#64748b' }}>
          <p>Hesabın yok mu? <Link to="/register" style={{ color: isDark ? '#60a5fa' : '#0052cc', textDecoration: 'none', fontWeight: 'bold' }}>Kayıt Ol</Link></p>
        </div>
      </div>
    </div>
  );
}