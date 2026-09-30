import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

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