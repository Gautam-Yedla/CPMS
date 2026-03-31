import { useEffect, useState } from 'react';
import { Box, Typography, Paper, useTheme, CircularProgress, Chip, useMediaQuery } from '@mui/material';
import { Navigation, MapPin, Activity, CheckCircle, AlertTriangle } from 'lucide-react';
import { api } from '@utils/services/api';
import PermissionGuard from '@shared/components/PermissionGuard';
import { toast } from 'react-toastify';

interface ZoneStatus {
  id: string;
  name: string;
  capacity: number;
  occupancy: number;
  available: number;
}

const ZoneMonitoringPage: React.FC = () => {
  const theme = useTheme();
  const [zones, setZones] = useState<ZoneStatus[]>([]);
  const [loading, setLoading] = useState(true);

  // Responsive breakpoints
  const isTinyMobile = useMediaQuery('(max-width:340px)');
  const isSmallMobile = useMediaQuery('(max-width:400px)');
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const fetchZones = async () => {
    try {
      const data = await api.fetchMLStatus();
      if (data && data.zones) {
        setZones(data.zones);
      }
    } catch (err) {
      console.error('Failed to fetch zones:', err);
      toast.error('Failed to connect to Zone Monitoring API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
    const interval = setInterval(fetchZones, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box 
      sx={{ 
        p: isTinyMobile ? 1.25 : isSmallMobile ? 1.5 : isMobile ? 2 : 3,
        minHeight: 'calc(100vh - 100px)',
        maxWidth: '100vw',
        overflowX: 'hidden',
        boxSizing: 'border-box'
      }}
    >
      {/* Standardized Header — 3.25rem scale */}
      <Box sx={{ mb: isTinyMobile ? 2 : isMobile ? 3 : 4 }}>
        <Box display="flex" alignItems="center" gap={isTinyMobile ? 1 : 1.5} mb={1}>
          <Navigation size={isTinyMobile ? 20 : 24} color={theme.palette.primary.main} />
          <Typography 
            fontWeight={900} 
            sx={{ 
              fontSize: isTinyMobile ? '1.75rem' : isSmallMobile ? '2.25rem' : '3.25rem', 
              letterSpacing: '-0.03em', 
              lineHeight: 1.1, 
              color: theme.palette.text.primary 
            }}
          >
            Live Zone Monitoring
          </Typography>
        </Box>
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            fontWeight: 500, 
            opacity: 0.9,
            fontSize: isTinyMobile ? '0.8rem' : undefined,
            pl: isTinyMobile ? 0 : 0
          }}
        >
          Track real-time occupancy across designated campus parking areas.
        </Typography>
      </Box>

      {loading && zones.length === 0 ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="40vh">
          <CircularProgress />
        </Box>
      ) : (
        <Box 
          sx={{ 
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)',
              xl: 'repeat(4, 1fr)'
            },
            gap: isTinyMobile ? 1.5 : isMobile ? 2 : 3
          }}
        >
          {zones.map((zone) => {
            const percent = (zone.occupancy / zone.capacity) * 100;
            let statusPhrase = 'Available';
            let statusColor = theme.palette.success.main;
            let Icon = CheckCircle;

            if (percent >= 100) {
              statusPhrase = 'FULL';
              statusColor = theme.palette.error.main;
              Icon = AlertTriangle;
            } else if (percent >= 80) {
              statusPhrase = 'Almost Full';
              statusColor = theme.palette.warning.main;
              Icon = Activity;
            }

            return (
              <Paper 
                key={zone.id}
                elevation={0}
                sx={{
                  p: isTinyMobile ? 1.5 : isMobile ? 2 : 3,
                  borderRadius: isTinyMobile ? '12px' : '16px',
                  border: `1px solid ${theme.palette.divider}`,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'transform 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  '&:hover': {
                    transform: isMobile ? 'none' : 'translateY(-4px)',
                    boxShadow: isMobile ? 'none' : '0 12px 24px -10px rgba(0,0,0,0.1)'
                  }
                }}
              >
                {/* Left accent bar */}
                <Box sx={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  bottom: 0, 
                  width: isTinyMobile ? '3px' : '4px', 
                  backgroundColor: statusColor 
                }} />
                
                {/* Zone header: name + status chip */}
                <Box 
                  display="flex" 
                  justifyContent="space-between" 
                  alignItems={isTinyMobile ? 'flex-start' : 'flex-start'}
                  flexDirection={isTinyMobile ? 'column' : 'row'}
                  mb={isTinyMobile ? 1.5 : 2}
                  gap={isTinyMobile ? 1 : 0}
                >
                  <Box display="flex" alignItems="center" gap={isTinyMobile ? 0.75 : 1.5} sx={{ minWidth: 0, flex: 1 }}>
                    <Box sx={{ 
                      p: isTinyMobile ? 0.75 : 1.2, 
                      borderRadius: isTinyMobile ? '8px' : '12px', 
                      background: `${theme.palette.primary.main}1A`, 
                      color: theme.palette.primary.main,
                      flexShrink: 0,
                      display: 'flex'
                    }}>
                      <MapPin size={isTinyMobile ? 16 : 22} />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography 
                        fontWeight={700} 
                        lineHeight={1.2}
                        sx={{ 
                          fontSize: isTinyMobile ? '0.9rem' : isMobile ? '1rem' : '1.15rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {zone.name}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        color="text.secondary" 
                        fontWeight={600}
                        sx={{ fontSize: isTinyMobile ? '0.65rem' : '0.75rem' }}
                      >
                        Zone ID: {zone.id}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip 
                    label={statusPhrase} 
                    size="small" 
                    icon={<Icon size={isTinyMobile ? 12 : 14} />}
                    sx={{ 
                      fontWeight: 700, 
                      backgroundColor: `${statusColor}1A`, 
                      color: statusColor,
                      border: `1px solid ${statusColor}40`,
                      '& .MuiChip-icon': { color: statusColor },
                      fontSize: isTinyMobile ? '0.7rem' : '0.75rem',
                      height: isTinyMobile ? '22px' : '28px',
                      flexShrink: 0
                    }} 
                  />
                </Box>

                {/* Occupancy progress bar */}
                <Box my={isTinyMobile ? 1.5 : 2.5}>
                  <Box display="flex" justifyContent="space-between" mb={0.75}>
                    <Typography 
                      variant="body2" 
                      fontWeight={600} 
                      color="text.secondary"
                      sx={{ fontSize: isTinyMobile ? '0.7rem' : '0.8rem' }}
                    >
                      Occupancy
                    </Typography>
                    <Typography 
                      variant="body2" 
                      fontWeight={800}
                      sx={{ fontSize: isTinyMobile ? '0.8rem' : '0.875rem' }}
                    >
                      {zone.occupancy} / {zone.capacity}
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    width: '100%', 
                    height: isTinyMobile ? '5px' : '8px', 
                    backgroundColor: theme.palette.divider, 
                    borderRadius: '4px', 
                    overflow: 'hidden' 
                  }}>
                    <Box 
                      sx={{ 
                        width: `${Math.min(percent, 100)}%`, 
                        height: '100%', 
                        backgroundColor: statusColor,
                        transition: 'width 0.5s ease-in-out'
                      }} 
                    />
                  </Box>
                </Box>

                {/* Available spots */}
                <Box 
                  display="flex" 
                  justifyContent="space-between" 
                  alignItems="center"
                >
                  <Typography 
                    fontWeight={800} 
                    color={statusColor}
                    sx={{ fontSize: isTinyMobile ? '1.5rem' : isMobile ? '1.75rem' : '2rem' }}
                  >
                    {zone.available > 0 ? zone.available : 0}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    fontWeight={600} 
                    textTransform="uppercase"
                    sx={{ 
                      fontSize: isTinyMobile ? '0.65rem' : '0.75rem',
                      letterSpacing: '0.5px'
                    }}
                  >
                    Spots Available
                  </Typography>
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default function PermissionWrappedZoneMonitoring() {
  return (
    <PermissionGuard permission="zones.faculty.view">
      <ZoneMonitoringPage />
    </PermissionGuard>
  );
}
