import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import useAuthStore from '../store/useAuthStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState(''); 
  
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage(''); 

    try {
      const response = await api.post('/auth/login', { email, password });
      
      const token = response.data.token;
      const user = response.data.user;

      // KESİN ÇÖZÜM: Token'ı her yere ZORLA kendimiz kaydediyoruz!
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Zustand'ı da çalıştır (hata verirse bile uygulamayı çökertmemesi için try-catch içinde)
      try { login(user, token); } catch(e) { console.log('Zustand uyarısı:', e); }
      
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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0052cc' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', width: '350px' }}>
        <h2 style={{ textAlign: 'center', color: '#172b4d', marginBottom: '20px' }}>Kanban Giriş</h2>
        
        {errorMessage && (
          <div style={{
            backgroundColor: '#ffebe6', color: '#bf2600', padding: '12px', borderRadius: '4px',
            border: '1px solid #ffbdad', marginBottom: '15px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold'
          }}>
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input 
            type="email" 
            placeholder="E-posta adresiniz" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #dfe1e6', fontSize: '14px' }}
          />
          <input 
            type="password" 
            placeholder="Şifreniz" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #dfe1e6', fontSize: '14px' }}
          />
          <button 
            type="submit" 
            style={{ padding: '12px', backgroundColor: '#5aac44', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}
          >
            Giriş Yap
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px' }}>
          <p>Hesabın yok mu? <Link to="/register" style={{ color: '#0052cc', textDecoration: 'none', fontWeight: 'bold' }}>Kayıt Ol</Link></p>
          <Link to="/forgot-password" style={{ color: '#0052cc', textDecoration: 'none' }}>Şifremi Unuttum</Link>
        </div>
      </div>
    </div>
  );
}