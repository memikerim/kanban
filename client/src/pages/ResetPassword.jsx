import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function ResetPassword() {
  const { token } = useParams(); // URL'deki token'ı yakalar
  const [newPassword, setNewPassword] = useState('');
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
        />
        
        <button type="submit">Şifreyi Güncelle</button>
      </form>
    </div>
  );
}