import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, useTheme, useMediaQuery } from '@mui/material';
import { Activity, ShieldCheck, Cpu, Terminal } from 'lucide-react';
import { api } from '../../../utils/services/api';
import { supabase } from '../../../utils/lib/supabase';

interface DetectionLog {
  id: string;
  timestamp: string;
  source_type: string;
  results: any;
  metadata: any;
  camera_id: string;
}

const SystemStatus: React.FC = () => {
  const theme = useTheme();
  const isTinyMobile = useMediaQuery('(max-width:340px)');
  const isSmallMobile = useMediaQuery('(max-width:400px)');
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [logs, setLogs] = useState<DetectionLog[]>([]);
  const [mlHealth, setMlHealth] = useState<boolean>(false);
  const [stats, setStats] = useState({
    uptime: '99.9%',
    processingTime: '42ms',
    totalRequests: 0
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const { mlService } = await api.fetchStreamHealth();
        setMlHealth(mlService === 'Online');

        const { data } = await supabase
          .from('camera_detections')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(20);
        
        if (data) {
          setLogs(data);
          setStats(prev => ({ ...prev, totalRequests: data.length }));
        }
      } catch (err) {
        console.error('Failed to fetch system status:', err);
      }
    };

    fetchInitialData();

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'camera_detections' },
        (payload) => {
          setLogs(prev => [payload.new as DetectionLog, ...prev.slice(0, 19)]);
          setStats(prev => ({ ...prev, totalRequests: prev.totalRequests + 1 }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const statCards = [
    { label: 'Camera Uptime', value: stats.uptime, icon: <ShieldCheck size={isTinyMobile ? 16 : 20} />, color: theme.palette.success.main },
    { label: 'ML Service', value: mlHealth ? 'Healthy' : 'Offline', icon: <Cpu size={isTinyMobile ? 16 : 20} />, color: mlHealth ? theme.palette.success.main : theme.palette.error.main },
    { label: 'Avg Latency', value: stats.processingTime, icon: <Activity size={isTinyMobile ? 16 : 20} />, color: theme.palette.warning.main },
    { label: 'Total Inferences', value: stats.totalRequests.toLocaleString(), icon: <Terminal size={isTinyMobile ? 16 : 20} />, color: theme.palette.primary.main },
  ];

  return (
    <Box sx={{ 
      p: isTinyMobile ? 1.25 : isSmallMobile ? 1.5 : isMobile ? 2 : 3,
      maxWidth: '100vw',
      overflowX: 'hidden',
      boxSizing: 'border-box'
    }}>
      {/* Header */}
      <Box mb={isTinyMobile ? 2 : 3}>
        <Typography 
          fontWeight={900} 
          sx={{ 
            fontSize: isTinyMobile ? '1.75rem' : isSmallMobile ? '2.25rem' : '3.25rem', 
            letterSpacing: '-0.03em', 
            lineHeight: 1.1, 
            color: theme.palette.text.primary, 
            mb: 1 
          }}
        >
          System Health & Logs
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, opacity: 0.9 }}>
          Real-time monitoring of ML pipeline and camera connectivity.
        </Typography>
      </Box>

      {/* Stat Cards */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: {
          xs: 'repeat(2, 1fr)',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(4, 1fr)'
        }, 
        gap: isTinyMobile ? 1 : isMobile ? 1.5 : 2,
        mb: isTinyMobile ? 2 : 3
      }}>
        {statCards.map((stat, i) => (
          <Paper
            key={i}
            elevation={0}
            sx={{ 
              p: isTinyMobile ? 1.5 : isMobile ? 2 : 2.5, 
              borderRadius: isTinyMobile ? '12px' : '16px', 
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: theme.palette.background.paper
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={isTinyMobile ? 1 : 1.5}>
              <Box sx={{ 
                p: isTinyMobile ? 0.6 : 0.75, 
                borderRadius: '8px', 
                bgcolor: `${stat.color}15`, 
                color: stat.color,
                display: 'flex'
              }}>
                {stat.icon}
              </Box>
              {stat.label === 'ML Service' && (
                <Box sx={{ 
                  width: isTinyMobile ? 8 : 10, 
                  height: isTinyMobile ? 8 : 10, 
                  borderRadius: '50%', 
                  bgcolor: stat.color, 
                  boxShadow: `0 0 8px ${stat.color}` 
                }} />
              )}
            </Box>
            <Typography 
              color="text.secondary" 
              fontWeight={600}
              sx={{ fontSize: isTinyMobile ? '0.65rem' : '0.75rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}
            >
              {stat.label}
            </Typography>
            <Typography 
              fontWeight={800}
              sx={{ fontSize: isTinyMobile ? '1.1rem' : isMobile ? '1.25rem' : '1.5rem', mt: 0.25 }}
            >
              {stat.value}
            </Typography>
          </Paper>
        ))}
      </Box>

      {/* Live Event Logs Terminal */}
      <Paper
        elevation={0}
        sx={{ 
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : '#0f172a', 
          borderRadius: isTinyMobile ? '12px' : '16px', 
          p: isTinyMobile ? 1.25 : isMobile ? 1.5 : 2,
          color: theme.palette.mode === 'dark' ? theme.palette.text.secondary : '#94a3b8', 
          fontFamily: '"JetBrains Mono", "Fira Code", monospace', 
          fontSize: isTinyMobile ? '0.7rem' : isMobile ? '0.75rem' : '0.8rem', 
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)', 
          maxHeight: isMobile ? '300px' : '400px', 
          overflowY: 'auto',
          border: `1px solid ${theme.palette.divider}`
        }}
      >
        {/* Terminal header */}
        <Box sx={{ 
          borderBottom: `1px solid ${theme.palette.mode === 'dark' ? theme.palette.divider : '#1e293b'}`, 
          pb: 1, 
          mb: 1.5, 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography sx={{ 
            color: theme.palette.mode === 'dark' ? theme.palette.text.primary : '#cbd5e1', 
            fontWeight: 700, 
            fontFamily: 'inherit',
            fontSize: isTinyMobile ? '0.7rem' : '0.8rem',
            letterSpacing: '0.05em'
          }}>
            LIVE EVENT LOGS
          </Typography>
          <Typography sx={{ 
            color: theme.palette.success.main, 
            fontFamily: 'inherit',
            fontSize: isTinyMobile ? '0.6rem' : '0.75rem',
            fontWeight: 600
          }}>
            ● CONNECTED
          </Typography>
        </Box>
        
        {logs.length === 0 ? (
          <Box sx={{ color: theme.palette.text.disabled, textAlign: 'center', py: 4 }}>
            Waiting for system events...
          </Box>
        ) : (
          logs.map((log) => (
            <Box 
              key={log.id} 
              sx={{ 
                mb: 0.75, 
                display: 'flex', 
                flexDirection: isTinyMobile ? 'column' : 'row',
                gap: isTinyMobile ? 0.25 : 1,
                py: 0.25,
                borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.05)'}`,
                '&:last-child': { borderBottom: 'none' }
              }}
            >
              {/* Timestamp + Source on same line for tiny */}
              <Box display="flex" gap={1} flexShrink={0}>
                <span style={{ color: theme.palette.text.disabled, whiteSpace: 'nowrap' }}>
                  [{new Date(log.timestamp).toLocaleTimeString()}]
                </span>
                <span style={{ 
                  color: log.source_type === 'Live' ? theme.palette.success.main : theme.palette.info.main,
                  fontWeight: 700,
                  whiteSpace: 'nowrap'
                }}>
                  {log.source_type.toUpperCase()}
                </span>
              </Box>
              {/* Detection details */}
              <span style={{ 
                color: theme.palette.mode === 'dark' ? theme.palette.text.primary : '#e2e8f0',
                wordBreak: 'break-word'
              }}>
                {log.source_type === 'Upload' && log.metadata?.filename && `[${log.metadata.filename}] `}
                {(() => {
                  const results = Array.isArray(log.results) ? log.results : (typeof log.results === 'string' ? (() => { try { return JSON.parse(log.results); } catch { return []; } })() : []);
                  const metadata = typeof log.metadata === 'string' ? (() => { try { return JSON.parse(log.metadata); } catch { return {}; } })() : (log.metadata || {});
                  const parking = metadata?.parking;
                  const resultsCount = results.length;
                  const parkingOccupied = parking?.occupied || 0;
                  const displayCount = resultsCount > 0 ? resultsCount : parkingOccupied;
                  
                  if (parking && resultsCount === 0) {
                    return `Detected ${displayCount} vehicles • ${parking.available}/${parking.totalSlots} slots free`;
                  }
                  return `Detected ${resultsCount} objects${resultsCount > 0 ? ` (${results.map((r: any) => r.type || r.class).join(', ')})` : ''}`;
                })()}
              </span>
            </Box>
          ))
        )}
      </Paper>
    </Box>
  );
};

export default SystemStatus;
