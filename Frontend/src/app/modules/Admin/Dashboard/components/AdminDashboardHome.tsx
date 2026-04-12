import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Stack, 
  useTheme, 
  useMediaQuery, 
  Fade, 
  CircularProgress,
  Button
} from '@mui/material';
import { 
  Car, 
  AlertCircle, 
  TrendingUp,
  Activity,
  MapPin,
  ShieldCheck,
  Zap,
  Globe
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '@app/utils/services/api';
import RecommendationCard from '@modules/Shared/Dashboard/widgets/RecommendationCard';
import ErrorBoundary from '@shared/components/ErrorBoundary';

interface MLZone {
  id: string;
  name: string;
  occupancy: number;
  capacity: number;
  available: number;
}

interface MLStatus {
  timestamp: number;
  active_violations?: number;
  zones: MLZone[];
  gates: {
    total_entered: number;
    total_exited: number;
  };
}

const AdminDashboardHome: React.FC = () => {
  return (
    <ErrorBoundary>
      <AdminDashboardHomeContent />
    </ErrorBoundary>
  );
};

const AdminDashboardHomeContent: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [mlStatus, setMlStatus] = useState<MLStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // UX Breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isExtraSmall = useMediaQuery('(max-width:400px)');
  const isTinyMobile = useMediaQuery('(max-width:340px)');

  // Adaptive Sizing (De-bulked)
  const containerPadding = isTinyMobile ? 1.5 : isExtraSmall ? 2.5 : isMobile ? 3 : 5;
  const cardRadius = '16px';
  const cardPadding = isTinyMobile ? 1.5 : isMobile ? 2 : 2.5;

  useEffect(() => {
    const fetchMLStatus = async () => {
      try {
        const status = await api.fetchMLStatus();
        setMlStatus(status);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch ML status:', error);
        setLoading(false);
      }
    };

    fetchMLStatus();
    const interval = setInterval(fetchMLStatus, 3000); 

    return () => clearInterval(interval);
  }, []);

  const totalOccupancy = mlStatus?.zones.reduce((acc, zone) => acc + zone.occupancy, 0) || 0;
  const totalCapacity = mlStatus?.zones.reduce((acc, zone) => acc + zone.capacity, 0) || 0;

  const stats = [
    { 
      label: 'Parking Status', 
      value: `${totalOccupancy}/${totalCapacity}`, 
      icon: <Activity size={isMobile ? 18 : 22} />, 
      color: theme.palette.primary.main, 
      trend: mlStatus ? 'Live' : 'Offline' 
    },
    { 
      label: 'Vehicles Entered', 
      value: mlStatus?.gates.total_entered.toString() || '0', 
      icon: <Globe size={isMobile ? 18 : 22} />, 
      color: theme.palette.success.main, 
      trend: 'Today' 
    },
    { 
      label: 'Vehicles Exited', 
      value: mlStatus?.gates.total_exited.toString() || '0', 
      icon: <Car size={isMobile ? 18 : 22} />, 
      color: theme.palette.warning.main, 
      trend: 'Today' 
    },
    { 
      label: 'Active Violations', 
      value: mlStatus?.active_violations?.toString() || '0', 
      icon: <AlertCircle size={isMobile ? 18 : 22} />, 
      color: theme.palette.error.main, 
      trend: 'Review Required' 
    },
  ];

  return (
    <Box p={containerPadding} display="flex" flexDirection="column" gap={isMobile ? 3 : 5}>
      
      {/* Header with Live Indicator */}
      <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} justifyContent="space-between" alignItems={isMobile ? 'flex-start' : 'flex-end'} gap={2}>
        <Box>
          <Typography fontWeight="900" sx={{ fontSize: isExtraSmall ? '1.75rem' : isMobile ? '2.25rem' : '3.25rem', letterSpacing: '-0.03em', lineHeight: 1.1, color: theme.palette.text.primary, mb: 1 }}>
            Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, opacity: 0.9 }}>
            Live campus parking monitoring and statistics.
          </Typography>
        </Box>
        
        {mlStatus && (
          <Box 
            sx={{ 
              px: 1.5, py: 0.75, borderRadius: '20px', bgcolor: `${theme.palette.success.main}10`,
              display: 'flex', alignItems: 'center', gap: 1, border: `1px solid ${theme.palette.success.main}20`
            }}
          >
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: theme.palette.success.main, animation: 'pulse 2s infinite ease-in-out' }} />
            <Typography variant="caption" sx={{ color: theme.palette.success.main, fontWeight: 900, letterSpacing: '0.05em' }}>LIVE UPDATES ACTIVE</Typography>
          </Box>
        )}
      </Box>

      {/* Main Stats Grid */}
      <Grid container spacing={isMobile ? 2 : 3}>
        {stats.map((stat, index) => (
          <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={index}>
            <Fade in={true} timeout={200 * index}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 2.5, borderRadius: cardRadius, border: `1px solid ${theme.palette.divider}`,
                  bgcolor: theme.palette.background.paper, display: 'flex', flexDirection: 'column', gap: 2
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box sx={{ p: 1, borderRadius: '10px', bgcolor: `${stat.color}08`, color: stat.color, display: 'flex' }}>
                    {stat.icon}
                  </Box>
                  <Typography variant="caption" sx={{ fontWeight: 900, color: stat.color, bgcolor: `${stat.color}10`, px: 1, py: 0.25, borderRadius: '4px', fontSize: '0.6rem' }}>{stat.trend}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight="800" sx={{ textTransform: 'uppercase', fontSize: '0.65rem', mb: 0.5, display: 'block' }}>{stat.label}</Typography>
                  <Typography variant="h5" fontWeight="900">{stat.value}</Typography>
                </Box>
              </Paper>
            </Fade>
          </Grid>
        ))}
      </Grid>

      {/* Area Status and Quick Actions Grid */}
      <Grid container spacing={isMobile ? 3 : 4}>
        {/* Right Detail Module: Area Status */}
        <Grid size={{ xs: 12, md: 7, lg: 8 }}>
          <Paper 
            elevation={0}
            sx={{ 
                p: cardPadding, borderRadius: cardRadius, border: `1px solid ${theme.palette.divider}`,
                bgcolor: theme.palette.background.paper, height: '100%'
            }}
          >
            <Box display="flex" flexDirection={isTinyMobile ? 'column' : 'row'} justifyContent="space-between" alignItems={isTinyMobile ? 'flex-start' : 'center'} mb={isTinyMobile ? 2 : 4} gap={isTinyMobile ? 1 : 0}>
               <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box sx={{ p: 1, borderRadius: '8px', bgcolor: 'rgba(0,0,0,0.03)', color: theme.palette.text.secondary }}>
                     <MapPin size={18} />
                  </Box>
                  <Typography variant="body1" fontWeight="900">Zone Monitoring</Typography>
               </Stack>
               <Typography variant="caption" color="text.secondary" fontWeight="900" sx={{ letterSpacing: '0.05em', opacity: 0.8 }}>REAL-TIME</Typography>
            </Box>

            <Box display="flex" flexDirection="column" gap={3}>
              {loading ? (
                 <Box display="flex" justifyContent="center" py={4}><CircularProgress size={30} /></Box>
              ) : mlStatus?.zones.map((zone) => {
                const percentage = (zone.occupancy / zone.capacity) * 100;
                const barColor = percentage > 90 ? theme.palette.error.main : percentage > 70 ? theme.palette.warning.main : theme.palette.success.main;
                
                return (
                  <Box key={zone.id}>
                    <Box display="flex" flexDirection={isTinyMobile ? 'column' : 'row'} justifyContent="space-between" mb={1} alignItems={isTinyMobile ? 'flex-start' : 'center'} gap={isTinyMobile ? 0.25 : 0}>
                      <Typography variant="body2" fontWeight="800" sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{zone.name}</Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight="800" sx={{ fontSize: isTinyMobile ? '0.65rem' : '0.75rem' }}>{zone.occupancy} / {zone.capacity} slots</Typography>
                    </Box>
                    <Box sx={{ height: 6, width: '100%', bgcolor: theme.palette.mode==='light'?'rgba(0,0,0,0.04)':'rgba(255,255,255,0.05)', borderRadius: 10, overflow: 'hidden' }}>
                      <Box sx={{ height: '100%', width: `${Math.min(percentage, 100)}%`, bgcolor: barColor, borderRadius: 10, transition: 'width 1s ease-in-out' }} />
                    </Box>
                  </Box>
                );
              })}
              {!mlStatus && !loading && (
                <Box textAlign="center" py={4} sx={{ opacity: 0.3 }}>
                   <Typography variant="body2">No live area data detected</Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Quick Actions & System Info */}
        <Grid size={{ xs: 12, md: 5, lg: 4 }}>
          <Stack spacing={isMobile ? 2 : 3} height="100%">
            <RecommendationCard />
            {/* Action Grid */}
            <Paper 
                elevation={0}
                sx={{ p: cardPadding, borderRadius: cardRadius, border: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.background.paper }}
            >
              <Typography variant="caption" color="text.secondary" fontWeight="900" sx={{ textTransform: 'uppercase', letterSpacing: '0.1em', mb: 2, display: 'block' }}>Quick Actions</Typography>
              <Grid container spacing={1.5}>
                {[
                  { label: 'Live Stream', icon: <Activity size={18} />, color: theme.palette.primary.main, path: '/admin/live-streams' },
                  { label: 'Review Permits', icon: <ShieldCheck size={18} />, color: theme.palette.success.main, path: '/admin/permits' },
                  { label: 'Report Status', icon: <TrendingUp size={18} />, color: theme.palette.warning.main, path: '/admin/reports' },
                  { label: 'Access Control', icon: <AlertCircle size={18} />, color: theme.palette.error.main, path: '/admin/settings' },
                ].map((action, i) => (
                  <Grid size={{ xs: 6 }} key={i}>
                    <Button 
                      fullWidth variant="outlined" 
                      onClick={() => navigate(action.path)}
                      sx={{ 
                        flexDirection: 'column', gap: 1, py: 2, borderRadius: '12px', 
                        border: `1px solid ${theme.palette.divider}`, color: theme.palette.text.primary,
                        textTransform: 'none', transition: 'none' 
                      }}
                    >
                      <Box sx={{ color: action.color }}>{action.icon}</Box>
                      <Typography variant="caption" fontWeight="800" sx={{ fontSize: '0.65rem' }}>{action.label}</Typography>
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </Paper>

            {/* Subtle System Info Card */}
            <Paper 
                elevation={0}
                sx={{ 
                    p: cardPadding, borderRadius: cardRadius, flex: 1,
                    background: theme.palette.mode === 'dark' ? `linear-gradient(135deg, ${theme.palette.background.paper} 0%, #1e1e2d 100%)` : theme.palette.primary.main,
                    color: 'white', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative'
                }}
            >
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Typography variant="body2" fontWeight="900" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                   <Zap size={16} /> System Status
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8, lineHeight: 1.5, display: 'block', mb: 2, fontSize: '0.75rem' }}>
                   Vision System is active syncing at low latency. Current pipeline processing at 15 FPS with encrypted secure streaming.
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                   <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#4ade80' }} />
                   <Typography variant="caption" fontWeight="900" sx={{ fontSize: '0.65rem' }}>CONNECTED</Typography>
                </Box>
              </Box>
              <Box sx={{ position: 'absolute', right: -20, bottom: -20, opacity: 0.05 }}>
                 <TrendingUp size={120} />
              </Box>
            </Paper>
          </Stack>
        </Grid>
      </Grid>
      
      <style>{`
        @keyframes pulse {
           0% { transform: scale(1); opacity: 0.8; }
           50% { transform: scale(1.2); opacity: 1; }
           100% { transform: scale(1); opacity: 0.8; }
        }
      `}</style>
    </Box>
  );
};

export default AdminDashboardHome;
