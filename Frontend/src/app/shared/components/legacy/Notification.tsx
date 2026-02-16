import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useTheme } from '@mui/material/styles';

export type NotificationType = 'success' | 'error' | 'info';

interface NotificationProps {
  message: string;
  type: NotificationType;
  onClose: () => void;
  duration?: number;
}

const Notification: React.FC<NotificationProps> = ({ message, type, onClose, duration = 5000 }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const icons = {
    success: <CheckCircle size={20} color={theme.palette.success.main} />,
    error: <AlertCircle size={20} color={theme.palette.error.main} />,
    info: <Info size={20} color={theme.palette.primary.main} />
  };

  const bgColors = {
    success: isDark ? 'rgba(34, 197, 94, 0.15)' : '#dcfce7', // stronger green
    error: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2',   // stronger red
    info: isDark ? 'rgba(59, 130, 246, 0.15)' : '#dbeafe'    // stronger blue
  };



  // Safe fallbacks for colors if theme palette is slightly different
  const getBorderColor = (t: NotificationType) => {
    if (t === 'success') return theme.palette.success.main;
    if (t === 'error') return theme.palette.error.main;
    return theme.palette.primary.main;
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '1rem 1.25rem',
        borderRadius: '12px',
        backgroundColor: bgColors[type],
        border: `1px solid ${getBorderColor(type)}`,
        boxShadow: theme.shadows[4],
        animation: 'slideIn 0.3s ease-out',
        maxWidth: '400px',
        minWidth: '300px',
        color: theme.palette.text.primary
      }}
    >
      {icons[type]}
      <span style={{ fontSize: '0.875rem', fontWeight: 500, flex: 1 }}>{message}</span>
      <button 
        onClick={onClose}
        style={{ 
          background: 'none', 
          border: 'none',
          padding: '6px', 
          display: 'flex', 
          cursor: 'pointer',
          borderRadius: '50%',
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <X size={20} color={theme.palette.text.secondary} />
      </button>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Notification;
