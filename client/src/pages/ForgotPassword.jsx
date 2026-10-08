import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import ThemeToggle from '../components/ThemeToggle';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);
    
    try {
      const response = await api.post('/auth/forgot-password', { email });
      setMessage(response.data.message);
    } catch (err) {
      setError(err.response?.data?.error || 'Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
        <ThemeToggle />
      </div>
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Şifremi Unuttum</h2>
        <p style={{ marginBottom: '15px', fontSize: '14px', color: '#555' }}>
          Hesabınıza kayıtlı e-posta adresini girin, size bir sıfırlama bağlantısı gönderelim.
        </p>
        
        {message && <div style={{ background: '#d4edda', color: '#155724', padding: '10px', borderRadius: '5px', marginBottom: '10px' }}>{message}</div>}
        {error && <div style={{ background: '#f8d7da', color: '#721c24', padding: '10px', borderRadius: '5px', marginBottom: '10px' }}>{error}</div>}
        
        <input 
          type="email" 
          placeholder="E-posta Adresiniz" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
        />
        
        <button type="submit" disabled={loading}>
          {loading ? 'Gönderiliyor...' : 'Sıfırlama Linki Gönder'}
        </button>
        
        <p style={{ marginTop: '15px' }}><Link to="/login">Giriş Sayfasına Dön</Link></p>
      </form>
    </div>
  );
}