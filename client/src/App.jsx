import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/useAuthStore.js';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Board from './pages/Board.jsx';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

import { ThemeProvider } from './context/ThemeContext.jsx';

function App() {
  const token = useAuthStore((state) => state.token);

  return (
    <ThemeProvider>
      <HashRouter>
        <Routes>
          {/* Giriş yapılmışsa Panoya, yapılmamışsa Login'e yönlendir */}
          <Route path="/" element={token ? <Navigate to="/board" /> : <Navigate to="/login" />} />
          
          <Route path="/login" element={!token ? <Login /> : <Navigate to="/board" />} />
          <Route path="/register" element={!token ? <Register /> : <Navigate to="/board" />} />
          
          {/* Pano rotası korunuyor (Sadece token varsa girilebilir) */}
          <Route path="/board" element={token ? <Board /> : <Navigate to="/login" />} />

          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
}

export default App; 