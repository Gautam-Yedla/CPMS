import React, { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import { 
  Bell, 
  CheckCheck, 
  AlertTriangle, 
  Info, 
  Clock,
  CheckCircle
} from 'lucide-react';
import { api } from '@utils/services/api';
import Notification from '@shared/components/legacy/Notification';

const StudentNotificationsPage: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await api.fetchNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setToast({ message: 'All notifications marked as read', type: 'success' });
    } catch (err) {
      setToast({ message: 'Failed to mark all as read', type: 'error' });
    }
  };

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => !n.is_read);

  const getIcon = (type: string) => {
    switch (type) {
      case 'permit': return <CheckCheck size={20} color={theme.palette.success.main} />;
      case 'security': return <AlertTriangle size={20} color={theme.palette.error.main} />;
      case 'system': return <Info size={20} color={theme.palette.info.main} />;
      default: return <Bell size={20} color={theme.palette.primary.main} />;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'permit': return theme.palette.success.main + '15';
      case 'security': return theme.palette.error.main + '15';
      case 'system': return theme.palette.info.main + '15';
      default: return theme.palette.primary.main + '15';
    }
  };

  return (
    <>
      {toast && (
        <Notification 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <header style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '2rem' 
        }}>
          <div>
            <h1 style={{ 
              fontSize: '2rem', 
              fontWeight: 800, 
              color: theme.palette.text.primary, 
              marginBottom: '0.5rem',
              letterSpacing: '-0.025em'
            }}>Notifications</h1>
            <p style={{ color: theme.palette.text.secondary }}>Stay updated with your permits and campus alerts.</p>
          </div>
          <button 
            onClick={handleMarkAllRead}
            disabled={notifications.every(n => n.is_read)}
            style={{
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.primary,
              border: `1px solid ${theme.palette.divider}`,
              padding: '0.75rem 1.25rem',
              borderRadius: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: notifications.every(n => n.is_read) ? 'default' : 'pointer',
              opacity: notifications.every(n => n.is_read) ? 0.5 : 1,
              transition: 'all 0.2s'
            }}
          >
            <CheckCircle size={18} />
            Mark all read
          </button>
        </header>

        {/* Filter Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          marginBottom: '2rem',
          borderBottom: `1px solid ${theme.palette.divider}` 
        }}>
          <button 
            onClick={() => setFilter('all')}
            style={{
              padding: '0.75rem 1rem',
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${filter === 'all' ? theme.palette.primary.main : 'transparent'}`,
              color: filter === 'all' ? theme.palette.primary.main : theme.palette.text.secondary,
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: '-1px'
            }}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('unread')}
            style={{
              padding: '0.75rem 1rem',
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${filter === 'unread' ? theme.palette.primary.main : 'transparent'}`,
              color: filter === 'unread' ? theme.palette.primary.main : theme.palette.text.secondary,
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: '-1px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            Unread
            {notifications.some(n => !n.is_read) && (
              <span style={{ 
                backgroundColor: theme.palette.primary.main, 
                color: 'white', 
                fontSize: '0.75rem', 
                padding: '2px 6px', 
                borderRadius: '10px' 
              }}>
                {notifications.filter(n => !n.is_read).length}
              </span>
            )}
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>Loading notifications...</div>
        ) : filteredNotifications.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '4rem 2rem', 
            backgroundColor: theme.palette.background.paper,
            borderRadius: '24px',
            border: `1px dashed ${theme.palette.divider}`
          }}>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              borderRadius: '50%', 
              backgroundColor: theme.palette.action.hover, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 1.5rem',
              color: theme.palette.text.secondary
            }}>
              <Bell size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>All caught up!</h3>
            <p style={{ color: theme.palette.text.secondary }}>You have no {filter === 'unread' ? 'unread' : ''} notifications.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredNotifications.map((notif) => (
              <div 
                key={notif.id}
                onClick={!notif.is_read ? (e) => handleMarkRead(notif.id, e) : undefined}
                style={{
                  backgroundColor: theme.palette.background.paper,
                  padding: '1.5rem',
                  borderRadius: '20px',
                  display: 'flex',
                  gap: '1.25rem',
                  border: isDark ? `1px solid ${theme.palette.divider}` : 'none',
                  boxShadow: !isDark ? '0 4px 6px -1px rgba(0,0,0,0.02)' : 'none',
                  position: 'relative',
                  cursor: !notif.is_read ? 'pointer' : 'default',
                  opacity: notif.is_read ? 0.7 : 1,
                  transition: 'transform 0.2s'
                }}
                className={!notif.is_read ? 'hover-lift' : ''}
              >
                {!notif.is_read && (
                  <div style={{
                    position: 'absolute',
                    top: '1.5rem',
                    right: '1.5rem',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: theme.palette.primary.main
                  }} />
                )}

                <div style={{
                  flexShrink: 0,
                  width: '50px',
                  height: '50px',
                  borderRadius: '16px',
                  backgroundColor: getIconBg(notif.type),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {getIcon(notif.type)}
                </div>

                <div style={{ flex: 1, paddingRight: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{notif.title}</h3>
                    <span style={{ fontSize: '0.75rem', color: theme.palette.text.disabled, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={12} />
                      {new Date(notif.created_at).toLocaleDateString()} {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p style={{ margin: 0, color: theme.palette.text.secondary, lineHeight: 1.6 }}>{notif.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .hover-lift:hover { transform: translateY(-2px); }
      `}</style>
    </>
  );
};

export default StudentNotificationsPage;
