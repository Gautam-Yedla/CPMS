import React, { useState, useEffect } from 'react';
import { 
  Car, 
  AlertCircle, 
  TrendingUp,
  Activity,
  MapPin
} from 'lucide-react';
import { useTheme } from '@mui/material/styles';
import { api } from '@app/utils/services/api';

interface MLZone {
  id: string;
  name: string;
  occupancy: number;
  capacity: number;
  available: number;
}

interface MLStatus {
  timestamp: number;
  zones: MLZone[];
  gates: {
    total_entered: number;
    total_exited: number;
  };
}

const AdminDashboardHome: React.FC = () => {
  const theme = useTheme();
  const [mlStatus, setMlStatus] = useState<MLStatus | null>(null);

  useEffect(() => {
    const fetchMLStatus = async () => {
      try {
        const status = await api.fetchMLStatus();
        setMlStatus(status);
      } catch (error) {
        console.error('Failed to fetch ML status:', error);
      }
    };

    fetchMLStatus();
    const interval = setInterval(fetchMLStatus, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, []);

  const totalOccupancy = mlStatus?.zones.reduce((acc, zone) => acc + zone.occupancy, 0) || 0;
  const totalCapacity = mlStatus?.zones.reduce((acc, zone) => acc + zone.capacity, 0) || 0;

  const stats = [
    { 
      label: 'Live Occupancy', 
      value: `${totalOccupancy}/${totalCapacity}`, 
      icon: <Activity size={24} />, 
      color: '#6366f1', 
      trend: mlStatus ? 'Live Feed Active' : 'Offline' 
    },
    { 
      label: 'Vehicles Entered', 
      value: mlStatus?.gates.total_entered.toString() || '0', 
      icon: <Car size={24} />, 
      color: '#10b981', 
      trend: 'Today\'s Total' 
    },
    { 
      label: 'Vehicles Exited', 
      value: mlStatus?.gates.total_exited.toString() || '0', 
      icon: <Car size={24} />, 
      color: '#f59e0b', 
      trend: 'Today\'s Total' 
    },
    { 
      label: 'Active Violations', 
      value: '3', 
      icon: <AlertCircle size={24} />, 
      color: '#ef4444', 
      trend: 'Requiring Attention' 
    },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: theme.palette.text.primary, marginBottom: '0.5rem' }}>
            Admin Dashboard
          </h1>
          <p style={{ color: theme.palette.text.secondary }}>
            Real-time campus parking monitoring and management.
          </p>
        </div>
        {mlStatus && (
          <div style={{ 
            fontSize: '0.75rem', 
            color: '#10b981', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.35rem', 
            marginBottom: '0.5rem',
            padding: '0.4rem 0.8rem',
            borderRadius: '20px',
            backgroundColor: '#10b98115',
            fontWeight: 600
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', animation: 'pulse 2s infinite' }}></div>
            LIVE DATA UPDATING
          </div>
        )}
      </header>

      {/* Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '1.5rem',
        marginBottom: '2.5rem'
      }}>
        {stats.map((stat, index) => (
          <div key={index} style={{
            backgroundColor: theme.palette.background.paper,
            padding: '1.5rem',
            borderRadius: '16px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
            border: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ 
                padding: '0.75rem', 
                borderRadius: '12px', 
                backgroundColor: `${stat.color}15`, 
                color: stat.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {stat.icon}
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: stat.color === '#ef4444' ? '#ef4444' : '#10b981' }}>{stat.trend}</span>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 500, color: theme.palette.text.secondary, marginBottom: '0.25rem' }}>
                {stat.label}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: theme.palette.text.primary }}>
                {stat.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        {/* Real-time Zone Monitoring */}
        <div style={{
          backgroundColor: theme.palette.background.paper,
          padding: '1.5rem',
          borderRadius: '16px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
          border: `1px solid ${theme.palette.divider}`
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={20} /> Zone Occupancy
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {mlStatus?.zones.map((zone) => {
              const percentage = (zone.occupancy / zone.capacity) * 100;
              const barColor = percentage > 90 ? '#ef4444' : percentage > 70 ? '#f59e0b' : '#10b981';
              
              return (
                <div key={zone.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9375rem' }}>
                    <span style={{ fontWeight: 600 }}>{zone.name}</span>
                    <span style={{ color: theme.palette.text.secondary }}>{zone.occupancy} / {zone.capacity} slots</span>
                  </div>
                  <div style={{ height: '8px', width: '100%', backgroundColor: theme.palette.mode === 'light' ? '#f1f5f9' : '#334155', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${Math.min(percentage, 100)}%`, 
                      backgroundColor: barColor,
                      transition: 'width 0.5s ease-in-out',
                      borderRadius: '4px'
                    }}></div>
                  </div>
                </div>
              );
            })}
            {!mlStatus && <p style={{ textAlign: 'center', color: theme.palette.text.secondary, padding: '2rem' }}>No live data available</p>}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{
          backgroundColor: theme.palette.background.paper,
          padding: '1.5rem',
          borderRadius: '16px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
          border: `1px solid ${theme.palette.divider}`
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>Quick Actions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {[
              { label: 'Live Stream', icon: <Car size={20} />, color: '#6366f1' },
              { label: 'View Logs', icon: <Activity size={20} />, color: '#10b981' },
              { label: 'Analytics', icon: <TrendingUp size={20} />, color: '#f59e0b' },
              { label: 'Emergency', icon: <AlertCircle size={20} />, color: '#ef4444' },
            ].map((action, i) => (
              <div key={i} style={{
                padding: '1.25rem',
                borderRadius: '12px',
                border: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }} className="quick-action-card">
                <div style={{ color: action.color }}>{action.icon}</div>
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{action.label}</span>
              </div>
            ))}
          </div>
          
          <div style={{ 
            marginTop: '2rem', 
            padding: '1.5rem', 
            borderRadius: '12px', 
            backgroundColor: theme.palette.mode === 'light' ? '#6366f1' : '#4f46e5',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.5rem' }}>System Status</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '1rem' }}>ML Pipeline is connected. Processing frames at 15 FPS.</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4ade80' }}></div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Streaming</span>
              </div>
            </div>
            <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.1 }}>
              <TrendingUp size={120} />
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        .quick-action-card:hover {
          background-color: ${theme.palette.mode === 'light' ? '#f8fafc' : '#1e293b'};
          transform: translateY(-2px);
          border-color: ${theme.palette.primary.main}40;
        }

        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboardHome;
