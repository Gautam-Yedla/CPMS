import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { Box, Typography, Chip, CircularProgress } from '@mui/material';
import { 
  Car, 
  MapPin, 
  CreditCard, 
  AlertCircle,
  MessageSquare,
  Clock,
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

        {/* Recent Tickets Snippet */}
        <div style={{ 
          backgroundColor: theme.palette.background.paper, 
          borderRadius: '24px', 
          boxShadow: theme.palette.mode === 'light' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
          border: theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: theme.palette.text.primary, margin: 0 }}>Recent Support Tickets</h2>
            <Typography 
              variant="caption" 
              sx={{ 
                color: theme.palette.primary.main, 
                cursor: 'pointer', 
                fontWeight: 700,
                '&:hover': { textDecoration: 'underline' } 
              }}
              onClick={() => navigate('/student/report')}
            >
              View All
            </Typography>
          </Box>
          <TicketHistorySnippet />
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
              { label: 'View My Tickets', icon: <MessageSquare size={18} />, path: '/student/report' },
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

const TicketHistorySnippet = () => {
    const theme = useTheme();
    const [tickets, setTickets] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const loadTickets = async () => {
             try {
                 const data = await api.fetchTickets();
                 if (Array.isArray(data)) setTickets(data.slice(0, 2)); // Only show latest 2
             } catch (e) {
                 console.error("Failed to load tickets", e);
             } finally {
                 setLoading(false);
             }
        };
        loadTickets();
    }, []);

    if (loading) return (
        <Box display="flex" justifyContent="center" py={2}>
            <CircularProgress size={24} />
        </Box>
    );
    
    if (tickets.length === 0) return (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            No recent tickets.
        </Typography>
    );

    return (
        <Box sx={{ display: 'grid', gap: '1rem' }}>
            {tickets.map(ticket => {
                const statusStr = ticket.status?.toLowerCase() || 'open';
                const statusColor = statusStr === 'open' ? '#10b981' : 
                                  statusStr === 'pending' ? '#f59e0b' : '#64748b';
                
                return (
                    <Box key={`${ticket.id}-${statusStr}`} sx={{
                        p: 2,
                        borderRadius: '16px',
                        bgcolor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <Box sx={{ 
                            position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px',
                            bgcolor: statusColor
                        }} />
                        <Box display="flex" justifyContent="space-between" mb={1}>
                            <Typography variant="subtitle2" fontWeight="700" noWrap sx={{ maxWidth: '70%' }}>
                                {ticket.subject}
                            </Typography>
                            <Chip 
                                label={statusStr.charAt(0).toUpperCase() + statusStr.slice(1)} 
                                size="small" 
                                sx={{ 
                                    height: '18px', fontSize: '0.65rem', fontWeight: 800,
                                    bgcolor: `${statusColor}15`, color: statusColor, border: `1px solid ${statusColor}30`
                                }} 
                            />
                        </Box>
                        <Box display="flex" alignItems="center" gap={0.5} color="text.secondary">
                             <Clock size={12} />
                             <Typography variant="caption">
                                 {new Date(ticket.created_at).toLocaleDateString()}
                             </Typography>
                        </Box>
                    </Box>
                );
            })}
        </Box>
    );
};


export default StudentDashboardWrapper;
