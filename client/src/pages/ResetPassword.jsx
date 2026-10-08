import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import ThemeToggle from '../components/ThemeToggle';

export default function ResetPassword() {
  const { token } = useParams(); // URL'deki token'ı yakalar
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    // Frontend doğrulaması
    if (newPassword.length < 6) {
      return setError('Şifre en az 6 karakter olmalıdır.');
    }

    if (newPassword !== confirmPassword) {
      return setError('Şifreler eşleşmiyor! Lütfen kontrol edin.');
    }

    try {
      const response = await api.post(`/auth/reset-password/${token}`, { newPassword });
      setMessage(response.data.message);
      // Başarılı olursa 3 saniye sonra login sayfasına at
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Süresi dolmuş veya geçersiz bağlantı.');
    }
  };

  return (
    <div className="auth-container">
      <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
        <ThemeToggle />
      </div>
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Yeni Şifre Belirle</h2>
        
        {message && <div style={{ background: '#d4edda', color: '#155724', padding: '10px', borderRadius: '5px', marginBottom: '10px' }}>{message}</div>}
        {error && <div style={{ background: '#f8d7da', color: '#721c24', padding: '10px', borderRadius: '5px', marginBottom: '10px' }}>{error}</div>}
        
        <input 
          type="password" 
          placeholder="Yeni Şifre (En az 6 hane)" 
          value={newPassword} 
          onChange={(e) => setNewPassword(e.target.value)} 
          required 
          autoComplete="new-password"
        />
        <input 
          type="password" 
          placeholder="Şifre Tekrar" 
          value={confirmPassword} 
          onChange={(e) => setConfirmPassword(e.target.value)} 
          required 
          autoComplete="new-password"
          style={{ 
            borderColor: confirmPassword && newPassword !== confirmPassword ? '#ff5630' : undefined,
            borderWidth: confirmPassword && newPassword !== confirmPassword ? '2px' : undefined
          }}
        />
        {confirmPassword && newPassword !== confirmPassword && (
          <small style={{ color: '#ff5630', fontSize: '12px' }}>⚠ Şifreler eşleşmiyor</small>
        )}
        {confirmPassword && newPassword === confirmPassword && confirmPassword.length >= 6 && (
          <small style={{ color: '#36B37E', fontSize: '12px' }}>✓ Şifreler eşleşiyor</small>
        )}
        
        <button type="submit">Şifreyi Güncelle</button>
      </form>
    </div>
  );
}