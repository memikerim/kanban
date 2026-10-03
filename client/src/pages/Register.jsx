import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

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
      // YENİ EKLENEN KISIM: Özel E-posta Kontrolü
      if (error.response && error.response.status === 409) {
        setErrorMessage("Bu e-posta adresi zaten kullanılıyor. Lütfen başka bir e-posta deneyin veya giriş yapın.");
      } 
      else if (error.response && error.response.data && error.response.data.error) {
        // Backend'den gelen P2002 (Prisma Unique Constraint) hatasını yakalama
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

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0052cc' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', width: '350px' }}>
        <h2 style={{ textAlign: 'center', color: '#172b4d', marginBottom: '20px' }}>Kanban Kayıt Ol</h2>
        
        {errorMessage && (
          <div style={{
            backgroundColor: '#ffebe6', color: '#bf2600', padding: '12px', borderRadius: '4px',
            border: '1px solid #ffbdad', marginBottom: '15px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold'
          }}>
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div style={{
            backgroundColor: '#e3fcef', color: '#006644', padding: '12px', borderRadius: '4px',
            border: '1px solid #abf5d1', marginBottom: '15px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold'
          }}>
            {successMessage}
          </div>
        )}

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input 
            type="text" 
            placeholder="Adınız Soyadınız" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #dfe1e6', fontSize: '14px' }}
          />
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
            placeholder="Şifreniz (En az 6 karakter)" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            autoComplete="new-password"
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #dfe1e6', fontSize: '14px' }}
          />
          <input 
            type="password" 
            placeholder="Şifre Tekrar" 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            required 
            autoComplete="new-password"
            style={{ 
              padding: '10px', borderRadius: '4px', fontSize: '14px',
              border: confirmPassword && password !== confirmPassword ? '2px solid #ff5630' : '1px solid #dfe1e6'
            }}
          />
          {confirmPassword && password !== confirmPassword && (
            <small style={{ color: '#ff5630', fontSize: '12px', marginTop: '-10px' }}>⚠ Şifreler eşleşmiyor</small>
          )}
          {confirmPassword && password === confirmPassword && confirmPassword.length >= 6 && (
            <small style={{ color: '#36B37E', fontSize: '12px', marginTop: '-10px' }}>✓ Şifreler eşleşiyor</small>
          )}

          {/* Robot Kontrolü Alanı */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#f4f5f7', padding: '12px', borderRadius: '4px', border: '1px solid #dfe1e6' }}>
            <span style={{ fontSize: '13px', color: '#172b4d', fontWeight: 'bold' }}>Robot Kontrolü</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: '#091e42', color: 'white', padding: '8px 15px', borderRadius: '4px', fontSize: '18px', fontWeight: 'bold', letterSpacing: '2px', userSelect: 'none' }}>
                {captchaCode}
              </div>
              <input 
                type="text" 
                placeholder="Yandaki kodu girin" 
                value={userCaptchaInput} 
                onChange={(e) => setUserCaptchaInput(e.target.value)} 
                required 
                maxLength="6"
                style={{ padding: '10px', borderRadius: '4px', border: '1px solid #dfe1e6', fontSize: '14px', flex: 1 }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            style={{ padding: '12px', backgroundColor: '#5aac44', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}
          >
            Kayıt Ol
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px' }}>
          <p>Zaten hesabın var mı? <Link to="/login" style={{ color: '#0052cc', textDecoration: 'none', fontWeight: 'bold' }}>Giriş Yap</Link></p>
        </div>
      </div>
    </div>
  );
}