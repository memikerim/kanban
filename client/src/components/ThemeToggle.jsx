import React from 'react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ style = {}, showLabel = true, className = '' }) {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={className}
      title={`Temayı Değiştir (Şu an: ${isDark ? 'Koyu' : 'Açık'})`}
      style={{
        padding: '7px 12px',
        borderRadius: '6px',
        border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
        background: isDark ? '#1e293b' : '#ffffff',
        color: isDark ? '#f8fafc' : '#0f172a',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '12px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.15s ease',
        boxShadow: isDark ? '0 1px 3px rgba(0,0,0,0.4)' : '0 1px 3px rgba(0,0,0,0.06)',
        ...style
      }}
    >
      <span style={{ fontSize: '14px' }}>{isDark ? '☀️' : '🌙'}</span>
      {showLabel && <span>{isDark ? 'Açık Tema' : 'Koyu Tema'}</span>}
    </button>
  );
}

