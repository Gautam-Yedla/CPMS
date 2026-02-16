import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { api } from '@utils/services/api';

const ActivityLogPage: React.FC = () => {
  const theme = useTheme();
  const { user } = useSelector((state: any) => state.app.auth);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const data = await api.fetchActivityLogs();
      setActivities(data);
    } catch (err) {
      console.error('Failed to load activity logs', err);
    } finally {
      setLoading(false);
    }
  };
  
  const formatActionType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: 800, 
          color: theme.palette.text.primary, 
          marginBottom: '0.5rem',
          letterSpacing: '-0.025em'
        }}>History</h1>
        <p style={{ color: theme.palette.text.secondary }}>View your account activity and change history.</p>
      </header>

      <div style={{ 
        backgroundColor: theme.palette.background.paper, 
        borderRadius: '12px', 
        overflow: 'hidden',
        boxShadow: theme.palette.mode === 'light' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
        border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none'
      }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: theme.palette.text.secondary }}>Loading history...</div>
        ) : activities.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: theme.palette.text.secondary }}>No history found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: theme.palette.mode === 'light' ? '#f8fafc' : '#1e1e2d', borderBottom: `1px solid ${theme.palette.divider}` }}>
                  {['User', 'Event', 'Date', 'Time', 'Description'].map((head) => (
                    <th key={head} style={{ 
                      padding: '1rem 1.5rem', 
                      fontWeight: 600, 
                      color: theme.palette.text.secondary,
                      textTransform: 'uppercase',
                      fontSize: '0.75rem',
                      letterSpacing: '0.05em'
                    }}>
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activities.map((log, i) => (
                  <tr key={log.id} style={{ 
                    borderBottom: i === activities.length - 1 ? 'none' : `1px solid ${theme.palette.divider}`,
                    transition: 'background-color 0.2s'
                  }} className="table-row">
                    <td style={{ padding: '1rem 1.5rem', color: theme.palette.primary.main, fontWeight: 500 }}>
                      {/* Ideally fetch user name, but for now specific to this user/student view */}
                      {user?.full_name || 'Me'} 
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: theme.palette.text.primary, fontWeight: 500 }}>
                      {formatActionType(log.action_type)}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: theme.palette.text.secondary }}>
                      {new Date(log.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: theme.palette.text.secondary }}>
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: theme.palette.text.primary, maxWidth: '400px', whiteSpace: 'pre-wrap' }}>
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        .table-row:hover { background-color: ${theme.palette.mode === 'light' ? '#f8fafc' : '#232334'}; }
      `}</style>
    </div>
  );
};

export default ActivityLogPage;
