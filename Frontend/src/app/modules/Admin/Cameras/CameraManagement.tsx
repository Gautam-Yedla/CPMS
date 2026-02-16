import React, { useEffect, useState } from 'react';
import { Plus, Settings2, Trash2, Camera, MapPin } from 'lucide-react';
import { api } from '../../../utils/services/api';
import { useTheme } from '@mui/material/styles';

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
      } catch (error) {
        alert('Failed to delete camera');
      }
    }
  };

  return (
    <div style={{ padding: '2rem', color: theme.palette.text.primary }}>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>Camera Management</h1>
          <p style={{ color: theme.palette.text.secondary }}>Configure and maintain campus surveillance hardware.</p>
        </div>
        <button style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          padding: '0.75rem 1.25rem', 
          backgroundColor: theme.palette.primary.main, 
          color: 'white', 
          border: 'none', 
          borderRadius: '8px',
          fontWeight: 600,
          cursor: 'pointer'
        }}>
          <Plus size={20} /> Add New Camera
        </button>
      </header>

      <div style={{ 
        backgroundColor: theme.palette.background.paper, 
        borderRadius: '12px', 
        border: `1px solid ${theme.palette.divider}`, 
        overflow: 'hidden', 
        boxShadow: theme.shadows[1] 
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f8fafc', borderBottom: `1px solid ${theme.palette.divider}` }}>
            <tr>
              <th style={{ padding: '1.25rem 1rem', fontWeight: 600, color: theme.palette.text.secondary }}>Camera Detail</th>
              <th style={{ padding: '1.25rem 1rem', fontWeight: 600, color: theme.palette.text.secondary }}>Location</th>
              <th style={{ padding: '1.25rem 1rem', fontWeight: 600, color: theme.palette.text.secondary }}>Type</th>
              <th style={{ padding: '1.25rem 1rem', fontWeight: 600, color: theme.palette.text.secondary }}>Status</th>
              <th style={{ padding: '1.25rem 1rem', fontWeight: 600, color: theme.palette.text.secondary }}>Last Activity</th>
              <th style={{ padding: '1.25rem 1rem', fontWeight: 600, color: theme.palette.text.secondary }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {cameras.length === 0 && !loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: theme.palette.text.disabled }}>
                  No cameras configured yet.
                </td>
              </tr>
            ) : (
              cameras.map((camera) => (
                <tr key={camera.id} style={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
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
                      color: camera.status === 'Online' ? theme.palette.success.main : camera.status === 'Error' ? theme.palette.error.main : theme.palette.text.disabled,
                      fontSize: '0.875rem',
                      fontWeight: 600
                    }}>
                      <div style={{ 
                        width: '6px', 
                        height: '6px', 
                        borderRadius: '50%', 
                        backgroundColor: 'currentColor',
                        boxShadow: camera.status === 'Online' ? `0 0 8px ${theme.palette.success.main}` : 'none'
                      }}></div>
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CameraManagement;
