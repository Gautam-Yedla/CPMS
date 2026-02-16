import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { 
  Car, 
  Clock, 
  MapPin, 
  CreditCard, 
  AlertCircle
} from 'lucide-react';
import { IRootState } from '@app/appReducer';

import { api } from '@utils/services/api';

const StudentDashboardWrapper: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useSelector((state: IRootState) => state.app.auth);
  const [stats, setStats] = React.useState<any>(null);

  React.useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await api.fetchDashboardStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to load dashboard stats', err);
      }
    };
    loadStats();
  }, []);

  return (
    <>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: theme.palette.text.primary, marginBottom: '0.5rem' }}>Welcome Back, {user?.full_name.split(' ')[0]}!</h1>
        <p style={{ color: theme.palette.text.secondary }}>Here's what's happening with your campus parking today.</p>
      </header>

      {/* Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {[
          { label: 'Registered Vehicle', value: user?.vehicle_number || 'N/A', icon: <Car size={24} />, color: theme.palette.primary.main },
          { label: 'Active Permits', value: stats?.active_permits?.toString() || '0', icon: <CreditCard size={24} />, color: theme.palette.secondary.main },
          { label: 'Recent Violations', value: stats?.recent_violations?.toString() || '0', icon: <AlertCircle size={24} color={theme.palette.warning.main} />, color: theme.palette.warning.main },
          { 
            label: 'Last Check-in', 
            value: stats?.last_check_in 
              ? new Date(stats.last_check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
              : 'None', 
            icon: <Clock size={24} />, 
            color: '#8b5cf6' 
          },
        ].map((stat, i) => (
          <div key={i} style={{ 
            backgroundColor: theme.palette.background.paper, 
            padding: '1.5rem', 
            borderRadius: '12px', 
            boxShadow: theme.palette.mode === 'light' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
            border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{ 
              backgroundColor: `${stat.color}15`, 
              color: stat.color,
              padding: '0.75rem',
              borderRadius: '10px'
            }}>
              {stat.icon}
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: theme.palette.text.secondary, marginBottom: '0.25rem' }}>{stat.label}</div>
              <div style={{ fontSize: '1.125rem', fontWeight: 700, color: theme.palette.text.primary }}>{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Secondary Content */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {/* Main Card */}
        <div style={{ 
          backgroundColor: theme.palette.background.paper, 
          borderRadius: '12px', 
          boxShadow: theme.palette.mode === 'light' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
          border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '1.5rem', borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: theme.palette.text.primary }}>Vehicle Information</h2>
          </div>
          <div style={{ padding: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: theme.palette.text.secondary, marginBottom: '0.5rem' }}>Full Name</div>
                <div style={{ fontWeight: 500, color: theme.palette.text.primary }}>{user?.full_name}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: theme.palette.text.secondary, marginBottom: '0.5rem' }}>Student ID</div>
                <div style={{ fontWeight: 500, color: theme.palette.text.primary }}>{user?.student_id}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: theme.palette.text.secondary, marginBottom: '0.5rem' }}>Department</div>
                <div style={{ fontWeight: 500, color: theme.palette.text.primary }}>{user?.department}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: theme.palette.text.secondary, marginBottom: '0.5rem' }}>Vehicle Type</div>
                <div style={{ fontWeight: 500, color: theme.palette.text.primary }}>{user?.vehicle_type}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div style={{ 
          backgroundColor: theme.palette.background.paper, 
          borderRadius: '12px', 
          boxShadow: theme.palette.mode === 'light' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
          border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none',
          padding: '1.5rem'
        }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: theme.palette.text.primary, marginBottom: '1rem' }}>Quick Actions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { label: 'Find Parking Spot', icon: <MapPin size={18} />, path: '/student/status' },
              { label: 'Renew Permit', icon: <CreditCard size={18} />, path: '/student/status' },
              { label: 'Report an Issue', icon: <AlertCircle size={18} />, path: '/student/report' },
            ].map((action, i) => (
              <button 
                key={i}
                onClick={() => navigate(action.path)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  border: `1px solid ${theme.palette.divider}`,
                  backgroundColor: theme.palette.background.default,
                  color: theme.palette.text.secondary,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  transition: 'all 0.2s'
                }}
                className="action-button"
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        .action-button:hover {
          background-color: ${theme.palette.mode === 'light' ? '#f1f5f9' : '#334155'};
          color: ${theme.palette.text.primary};
          transform: translateY(-1px);
        }
      `}</style>
    </>
  );
};


export default StudentDashboardWrapper;
