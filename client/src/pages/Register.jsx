import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Robot kontrolü (6 haneli kod)
  const [captchaCode, setCaptchaCode] = useState('');
  const [userCaptchaInput, setUserCaptchaInput] = useState('');
  
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const { isDark } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    // Sayfa yüklendiğinde 6 haneli rastgele bir kod oluştur
    setCaptchaCode(Math.floor(100000 + Math.random() * 900000).toString());
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Robot doğrulama kontrolü
    if (userCaptchaInput !== captchaCode) {
      return setErrorMessage("Robot kontrol kodu hatalı. Lütfen tekrar deneyin.");
    }

    // Şifre doğrulama kontrolü
    if (password !== confirmPassword) {
      return setErrorMessage("Şifreler eşleşmiyor! Lütfen kontrol edin.");
    }

    if (password.length < 6) {
      return setErrorMessage("Şifre en az 6 karakter olmalıdır.");
    }

    try {
      const response = await api.post('/auth/register', { name, email, password });
      setSuccessMessage(response.data.message || "Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...");
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (error) {
      // Özel E-posta Kontrolü
      if (error.response && error.response.status === 409) {
        setErrorMessage("Bu e-posta adresi zaten kullanılıyor. Lütfen başka bir e-posta deneyin veya giriş yapın.");
      } 
      else if (error.response && error.response.data && error.response.data.error) {
        if (error.response.data.error.includes('Unique constraint failed') || error.response.data.error.includes('P2002')) {
           setErrorMessage("Bu e-posta adresi zaten kullanılıyor. Lütfen başka bir e-posta deneyin.");
        } else {
           setErrorMessage(error.response.data.error);
        }
      } else {
        setErrorMessage("Kayıt işlemi başarısız. Lütfen bilgilerinizi kontrol edin.");
      }
    }
  };

  const inputStyle = {
    padding: '11px 12px',
    borderRadius: '6px',
    border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    color: isDark ? '#f8fafc' : '#0f172a',
    fontSize: '14px',
    outline: 'none',
    width: '100%'
  };

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh',
      backgroundColor: isDark ? '#090d16' : '#f8fafc', position: 'relative', padding: '24px 16px',
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
        width: '100%', maxWidth: '390px', transition: 'all 0.2s ease'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <span style={{ fontSize: '32px' }}>📝</span>
          <h2 style={{ color: isDark ? '#f8fafc' : '#0f172a', margin: '8px 0 4px 0', fontSize: '22px', fontWeight: 'bold' }}>
            Kanban Kayıt Ol
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: isDark ? '#94a3b8' : '#64748b' }}>
            Yeni bir hesap oluşturup hemen başlayın
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

        {successMessage && (
          <div style={{
            backgroundColor: isDark ? '#143823' : '#e3fcef',
            color: isDark ? '#86efac' : '#006644',
            padding: '12px', borderRadius: '6px',
            border: `1px solid ${isDark ? '#166534' : '#abf5d1'}`,
            marginBottom: '16px', textAlign: 'center', fontSize: '13px', fontWeight: 'bold'
          }}>
            {successMessage}
          </div>
        )}

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: isDark ? '#cbd5e1' : '#475569' }}>
              Ad Soyad
            </label>
            <input 
              type="text" 
              placeholder="Adınız Soyadınız" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: isDark ? '#cbd5e1' : '#475569' }}>
              E-posta
            </label>
            <input 
              type="email" 
              placeholder="ornek@alanadi.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: isDark ? '#cbd5e1' : '#475569' }}>
              Şifre (En az 6 karakter)
            </label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              autoComplete="new-password"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: isDark ? '#cbd5e1' : '#475569' }}>
              Şifre Tekrar
            </label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              required 
              autoComplete="new-password"
              style={{
                ...inputStyle,
                border: confirmPassword && password !== confirmPassword ? '2px solid #ef4444' : inputStyle.border
              }}
            />
            {confirmPassword && password !== confirmPassword && (
              <small style={{ color: '#ef4444', fontSize: '12px', display: 'block', marginTop: '4px' }}>⚠ Şifreler eşleşmiyor</small>
            )}
            {confirmPassword && password === confirmPassword && confirmPassword.length >= 6 && (
              <small style={{ color: '#10b981', fontSize: '12px', display: 'block', marginTop: '4px' }}>✓ Şifreler eşleşiyor</small>
            )}
          </div>

          {/* Robot Kontrolü Alanı */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: '8px',
            background: isDark ? '#0f172a' : '#f8fafc', padding: '12px', borderRadius: '6px',
            border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`
          }}>
            <span style={{ fontSize: '12px', color: isDark ? '#cbd5e1' : '#475569', fontWeight: 'bold' }}>Robot Kontrolü</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                background: isDark ? '#334155' : '#0f172a', color: 'white',
                padding: '8px 14px', borderRadius: '6px', fontSize: '18px', fontWeight: 'bold',
                letterSpacing: '3px', userSelect: 'none'
              }}>
                {captchaCode}
              </div>
              <input 
                type="text" 
                placeholder="Yandaki kod" 
                value={userCaptchaInput} 
                onChange={(e) => setUserCaptchaInput(e.target.value)} 
                required 
                maxLength="6"
                style={{ ...inputStyle, flex: 1 }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            style={{
              padding: '12px', backgroundColor: '#10b981', color: 'white', border: 'none',
              borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', marginTop: '6px',
              transition: 'background-color 0.15s ease'
            }}
          >
            Kayıt Ol
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: isDark ? '#94a3b8' : '#64748b' }}>
          <p>Zaten hesabın var mı? <Link to="/login" style={{ color: isDark ? '#60a5fa' : '#0052cc', textDecoration: 'none', fontWeight: 'bold' }}>Giriş Yap</Link></p>
        </div>
      </div>
    </div>
  );
}