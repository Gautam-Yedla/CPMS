import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, useTheme, useMediaQuery, CircularProgress, Chip } from '@mui/material';
import { Plus, Settings2, Trash2, Camera, MapPin } from 'lucide-react';
import { api } from '../../../utils/services/api';

interface CameraItem {
  id: string;
  name: string;
  location: string;
  type: 'RTSP' | 'Webcam';
  status: 'Online' | 'Offline' | 'Error';
  last_heartbeat: string;
}

const CameraManagement: React.FC = () => {
  const theme = useTheme();
  const isTinyMobile = useMediaQuery('(max-width:340px)');
  const isSmallMobile = useMediaQuery('(max-width:400px)');
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [cameras, setCameras] = useState<CameraItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCameras = async () => {
      try {
        const data = await api.fetchCameras();
        setCameras(data);
      } catch (error) {
        console.error('Failed to load cameras:', error);
      } finally {
        setLoading(false);
      }
    };
    loadCameras();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this camera?')) {
      try {
        await api.deleteCamera(id);
        setCameras(cameras.filter(c => c.id !== id));
      } catch {
        alert('Failed to delete camera');
      }
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'Online') return theme.palette.success.main;
    if (status === 'Error') return theme.palette.error.main;
    return theme.palette.text.disabled;
  };

  return (
    <Box sx={{ 
      p: isTinyMobile ? 1.25 : isSmallMobile ? 1.5 : isMobile ? 2 : 3,
      maxWidth: '100vw',
      overflowX: 'hidden',
      boxSizing: 'border-box'
    }}>
      {/* Header */}
      <Box 
        display="flex" 
        flexDirection={isMobile ? 'column' : 'row'}
        justifyContent="space-between" 
        alignItems={isMobile ? 'flex-start' : 'center'}
        gap={isMobile ? 2 : 1}
        mb={isTinyMobile ? 2 : 3}
      >
        <Box>
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
            Camera Management
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, opacity: 0.9 }}>
            Configure and maintain campus surveillance hardware.
          </Typography>
        </Box>
        <button style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          padding: isTinyMobile ? '0.6rem 1rem' : '0.75rem 1.25rem', 
          backgroundColor: theme.palette.primary.main, 
          color: 'white', 
          border: 'none', 
          borderRadius: '12px',
          fontWeight: 600,
          cursor: 'pointer',
          fontSize: isTinyMobile ? '0.8rem' : '0.875rem',
          flexShrink: 0,
          boxShadow: `0 8px 16px ${theme.palette.primary.main}40`,
          width: isMobile ? '100%' : 'auto',
          justifyContent: 'center'
        }}>
          <Plus size={isTinyMobile ? 16 : 20} />
          Add New Camera
        </button>
      </Box>

      {/* Content */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : cameras.length === 0 ? (
        <Paper 
          elevation={0} 
          sx={{ 
            p: 6, 
            textAlign: 'center', 
            borderRadius: '16px', 
            border: `1px solid ${theme.palette.divider}` 
          }}
        >
          <Camera size={48} color={theme.palette.text.disabled} style={{ marginBottom: '1rem' }} />
          <Typography color="text.disabled" fontWeight={600}>No cameras configured yet.</Typography>
        </Paper>
      ) : isMobile ? (
        /* ===== MOBILE CARD LAYOUT ===== */
        <Box display="flex" flexDirection="column" gap={isTinyMobile ? 1.5 : 2}>
          {cameras.map((camera) => {
            const statusColor = getStatusColor(camera.status);
            return (
              <Paper
                key={camera.id}
                elevation={0}
                sx={{
                  p: isTinyMobile ? 1.5 : 2,
                  borderRadius: isTinyMobile ? '12px' : '16px',
                  border: `1px solid ${theme.palette.divider}`,
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Top: Name + Status */}
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                  <Box display="flex" alignItems="center" gap={1} sx={{ minWidth: 0, flex: 1 }}>
                    <Box sx={{ 
                      p: 0.75, 
                      borderRadius: '8px', 
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(59,130,246,0.1)' : '#eff6ff',
                      color: theme.palette.primary.main,
                      display: 'flex',
                      flexShrink: 0
                    }}>
                      <Camera size={isTinyMobile ? 16 : 18} />
                    </Box>
                    <Typography 
                      fontWeight={700} 
                      sx={{ 
                        fontSize: isTinyMobile ? '0.9rem' : '1rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {camera.name}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={0.5} sx={{ flexShrink: 0 }}>
                    <Box sx={{ 
                      width: 6, height: 6, borderRadius: '50%', 
                      bgcolor: statusColor,
                      boxShadow: camera.status === 'Online' ? `0 0 8px ${statusColor}` : 'none'
                    }} />
                    <Typography variant="caption" fontWeight={700} sx={{ color: statusColor, fontSize: isTinyMobile ? '0.7rem' : '0.75rem' }}>
                      {camera.status}
                    </Typography>
                  </Box>
                </Box>

                {/* Middle: Details */}
                <Box display="flex" flexWrap="wrap" gap={isTinyMobile ? 1 : 1.5} mb={1.5}>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <MapPin size={13} color={theme.palette.text.secondary} />
                    <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ fontSize: isTinyMobile ? '0.7rem' : '0.75rem' }}>
                      {camera.location}
                    </Typography>
                  </Box>
                  <Chip 
                    label={camera.type} 
                    size="small" 
                    sx={{ 
                      height: '20px', 
                      fontSize: '0.65rem', 
                      fontWeight: 700,
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                      color: theme.palette.text.primary
                    }} 
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: isTinyMobile ? '0.65rem' : '0.7rem' }}>
                    Last: {camera.last_heartbeat ? new Date(camera.last_heartbeat).toLocaleTimeString() : 'Never'}
                  </Typography>
                </Box>

                {/* Bottom: Actions */}
                <Box display="flex" justifyContent="flex-end" gap={0.5} pt={1} borderTop={`1px solid ${theme.palette.divider}`}>
                  <button style={{ 
                    padding: '0.4rem 0.75rem', background: 'none', 
                    border: `1px solid ${theme.palette.divider}`, borderRadius: '8px',
                    color: theme.palette.text.secondary, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem',
                    fontSize: '0.75rem', fontWeight: 600
                  }}>
                    <Settings2 size={14} /> Settings
                  </button>
                  <button 
                    onClick={() => handleDelete(camera.id)}
                    style={{ 
                      padding: '0.4rem 0.75rem', background: 'none', 
                      border: `1px solid ${theme.palette.error.main}30`, borderRadius: '8px',
                      color: theme.palette.error.main, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem',
                      fontSize: '0.75rem', fontWeight: 600
                    }}
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                </Box>
              </Paper>
            );
          })}
        </Box>
      ) : (
        /* ===== DESKTOP TABLE LAYOUT ===== */
        <Paper 
          elevation={0}
          sx={{ 
            borderRadius: '16px', 
            border: `1px solid ${theme.palette.divider}`, 
            overflow: 'hidden'
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ 
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f8fafc', 
              borderBottom: `1px solid ${theme.palette.divider}` 
            }}>
              <tr>
                {['Camera Detail', 'Location', 'Type', 'Status', 'Last Activity', 'Actions'].map(head => (
                  <th key={head} style={{ 
                    padding: '1rem', 
                    fontWeight: 700, 
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: theme.palette.text.secondary 
                  }}>
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cameras.map((camera, i) => {
                const statusColor = getStatusColor(camera.status);
                return (
                  <tr key={camera.id} style={{ borderBottom: i === cameras.length - 1 ? 'none' : `1px solid ${theme.palette.divider}` }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ 
                          padding: '0.5rem', 
                          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff', 
                          borderRadius: '8px', 
                          color: theme.palette.primary.main 
                        }}>
                          <Camera size={18} />
                        </div>
                        <div style={{ fontWeight: 600 }}>{camera.name}</div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: theme.palette.text.secondary }}>
                        <MapPin size={14} />
                        {camera.location}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        fontSize: '0.875rem', 
                        padding: '0.25rem 0.5rem', 
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f1f5f9', 
                        borderRadius: '4px',
                        color: theme.palette.text.primary
                      }}>
                        {camera.type}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.4rem',
                        color: statusColor,
                        fontSize: '0.875rem',
                        fontWeight: 600
                      }}>
                        <div style={{ 
                          width: '6px', height: '6px', borderRadius: '50%', 
                          backgroundColor: 'currentColor',
                          boxShadow: camera.status === 'Online' ? `0 0 8px ${statusColor}` : 'none'
                        }} />
                        {camera.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: theme.palette.text.secondary, fontSize: '0.875rem' }}>
                      {camera.last_heartbeat ? new Date(camera.last_heartbeat).toLocaleTimeString() : 'Never'}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button style={{ padding: '0.4rem', background: 'none', border: 'none', color: theme.palette.text.secondary, cursor: 'pointer' }}>
                          <Settings2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(camera.id)}
                          style={{ padding: '0.4rem', background: 'none', border: 'none', color: theme.palette.error.main, cursor: 'pointer' }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Paper>
      )}
    </Box>
  );
};

export default CameraManagement;
