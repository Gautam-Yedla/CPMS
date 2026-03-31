import { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Paper, useTheme, Button, Avatar, Chip, TextField, InputAdornment, LinearProgress, CircularProgress, useMediaQuery } from '@mui/material';
import { ParkingCircle, Plus, Search, Car, AlertTriangle, Key } from 'lucide-react';
import { api } from '@utils/services/api';
import { toast } from 'react-toastify';

export default function ParkingManagementPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isSmallMobile = useMediaQuery('(max-width:400px)');
  const isTinyMobile = useMediaQuery('(max-width:340px)');
  const isDark = theme.palette.mode === 'dark';

  const [searchTerm, setSearchTerm] = useState('');
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchZones = async () => {
    try {
      setLoading(true);
      const data = await api.fetchMLStatus();
      if (data && data.zones) {
        setZones(data.zones);
      }
    } catch (err) {
      console.error('Failed to fetch zones:', err);
      toast.error('Failed to load parking zones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
    // Poll every 10 seconds to keep live
    const interval = setInterval(fetchZones, 10000);
    return () => clearInterval(interval);
  }, []);

  const systemStats = useMemo(() => {
    const capacity = zones.reduce((acc, z) => acc + z.capacity, 0);
    const occupied = zones.reduce((acc, z) => acc + z.occupancy, 0);
    const ratio = capacity > 0 ? Math.round((occupied / capacity) * 100) : 0;
    return { capacity, occupied, ratio };
  }, [zones]);

  return (
    <Box p={isTinyMobile ? 1 : 2} minHeight="calc(100vh - 100px)" display="flex" flexDirection="column">
      {/* Header */}
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems={isMobile ? 'flex-start' : 'center'} 
        mb={isMobile ? 2 : 3} 
        flexDirection="row"
        gap={1}
      >
        <Box>
          <Typography fontWeight="900" sx={{ fontSize: isTinyMobile ? '1.75rem' : isSmallMobile ? '2.25rem' : '3.25rem', letterSpacing: '-0.03em', lineHeight: 1.1, color: theme.palette.text.primary, mb: 1 }}>
            Parking Zones
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, opacity: 0.9 }}>
            Live lot monitoring and capacity management
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          sx={{ 
            borderRadius: isMobile ? '50%' : '14px', 
            boxShadow: `0 8px 16px ${theme.palette.primary.main}40`, 
            minWidth: isMobile ? '44px' : 'auto',
            width: isMobile ? '44px' : 'auto',
            height: isMobile ? '44px' : '42px',
            px: isMobile ? 0 : 3,
            flexShrink: 0
          }}
          title="New Zone"
        >
          <Plus size={20} />
          {!isMobile && <span style={{ marginLeft: '8px' }}>New Zone</span>}
        </Button>
      </Box>

      {/* Search Bar */}
      <Box mb={3}>
        <Paper 
          elevation={0} 
          sx={{ 
            px: 2, 
            py: 0.5, 
            borderRadius: '12px',
            border: `1px solid ${theme.palette.divider}`,
            background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0,0,0,0.01)',
            width: '100%',
            maxWidth: isMobile ? '100%' : '320px'
          }}
        >
          <TextField 
            variant="standard" 
            placeholder="Search zones..." 
            fullWidth 
            InputProps={{ 
              disableUnderline: true, 
              style: { fontSize: '0.875rem' },
              startAdornment: <InputAdornment position="start"><Search size={18} color={theme.palette.text.secondary} /></InputAdornment>
            }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Paper>
      </Box>

      {/* KPI Row */}
      {loading && zones.length === 0 ? (
        <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
      ) : (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: isMobile ? 1.5 : 3, mb: 4 }}>
            {[
              { label: 'Capacity', value: systemStats.capacity.toString(), sub: 'Total Spots', icon: <ParkingCircle size={isMobile ? 20 : 24} /> },
              { label: 'Occupied', value: systemStats.occupied.toString(), sub: `${systemStats.ratio}% Full`, icon: <Car size={isMobile ? 20 : 24} /> },
              { label: 'Permits', value: '450+', sub: 'Active passes', icon: <Key size={isMobile ? 20 : 24} /> }
            ].map((stat, idx) => (
              <Paper
                key={idx}
                elevation={0}
                sx={{
                  p: isMobile ? 2 : 3,
                  borderRadius: '16px',
                  border: `1px solid ${theme.palette.divider}`,
                  background: isDark ? 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)' : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? 1.5 : 2,
                }}
              >
                <Avatar sx={{ bgcolor: `${theme.palette.primary.main}15`, color: theme.palette.primary.main, width: isMobile ? 44 : 56, height: isMobile ? 44 : 56 }}>
                  {stat.icon}
                </Avatar>
                <Box minWidth={0}>
                  <Typography color="text.secondary" variant="caption" fontWeight="700" textTransform="uppercase" letterSpacing={1}>{stat.label}</Typography>
                  <Typography variant={isMobile ? "h5" : "h4"} fontWeight="800" color="text.primary">{stat.value}</Typography>
                  {!isTinyMobile && <Typography variant="caption" color="text.secondary" noWrap>{stat.sub}</Typography>}
                </Box>
              </Paper>
            ))}
          </Box>

          {/* Zones Section */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="800">Active Zones</Typography>
            {isMobile && <Typography variant="caption" color="primary.main" fontWeight="700">{zones.length} Total</Typography>}
          </Box>
          
          <Box 
            sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fill, minmax(300px, 1fr))' }, 
              gap: isMobile ? 2 : 3 
            }}
          >
            {zones.filter(z => z.name.toLowerCase().includes(searchTerm.toLowerCase())).map((zone, i) => {
              const usagePercent = zone.capacity > 0 ? Math.round((zone.occupancy / zone.capacity) * 100) : 0;
              const colorPool = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
              const zoneColor = colorPool[i % colorPool.length];
              const isCritical = usagePercent >= 90;

              return (
                <Paper
                  key={zone.id}
                  elevation={0}
                  sx={{
                    p: isMobile ? 2 : 3,
                    borderRadius: '16px',
                    border: `1px solid ${theme.palette.divider}`,
                    borderTop: `4px solid ${isCritical ? theme.palette.error.main : zoneColor}`,
                    background: isDark ? 'rgba(255, 255, 255, 0.01)' : '#ffffff',
                    transition: 'all 0.2s ease',
                    '&:hover': { transform: isMobile ? 'none' : 'translateY(-4px)', boxShadow: isDark ? 'none' : `0 12px 24px ${zoneColor}20` }
                  }}
                >
                  <Box display="flex" flexDirection={isTinyMobile ? 'column' : 'row'} justifyContent="space-between" alignItems={isTinyMobile ? 'flex-start' : 'flex-start'} mb={2} gap={isTinyMobile ? 1 : 0}>
                    <Typography variant="subtitle1" fontWeight="800" sx={{ lineHeight: 1.2, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{zone.name}</Typography>
                    <Chip 
                      label={isCritical ? 'Critical' : 'Live'} 
                      size="small" 
                      sx={{ 
                        height: '20px',
                        fontSize: '0.625rem',
                        fontWeight: 800,
                        bgcolor: isCritical ? `${theme.palette.error.main}15` : `${zoneColor}15`,
                        color: isCritical ? theme.palette.error.main : zoneColor,
                        borderRadius: '6px',
                        textTransform: 'uppercase'
                      }} 
                    />
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" alignItems="flex-end" mb={1}>
                    <Typography variant="caption" color="text.secondary" fontWeight="700">USAGE</Typography>
                    <Typography variant="body2" fontWeight="800" color={isCritical ? 'error.main' : 'text.primary'}>
                      {zone.occupancy} / {zone.capacity}
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={usagePercent} 
                    sx={{ 
                      height: 6, 
                      borderRadius: 3, 
                      bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                      '& .MuiLinearProgress-bar': { bgcolor: isCritical ? theme.palette.error.main : zoneColor }
                    }} 
                  />
                  
                  {isCritical && (
                    <Box display="flex" alignItems="center" gap={1} mt={1.5} color="error.main">
                      <AlertTriangle size={14} />
                      <Typography variant="caption" fontWeight="700">Near Capacity</Typography>
                    </Box>
                  )}
                </Paper>
              )
            })}
          </Box>
        </>
      )}
    </Box>
  );
}
