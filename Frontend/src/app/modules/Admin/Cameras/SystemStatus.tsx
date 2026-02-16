import React, { useEffect, useState } from 'react';
import { Activity, ShieldCheck, Cpu, Terminal } from 'lucide-react';
import { api } from '../../../utils/services/api';
import { supabase } from '../../../utils/lib/supabase';
import { useTheme } from '@mui/material/styles';

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
        // Fetch ML Health
        const { mlService } = await api.fetchStreamHealth();
        setMlHealth(mlService === 'Online');

        // Fetch Recent Detections
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

    // Subscribe to new detections
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

  return (
    <div style={{ padding: '2rem', color: theme.palette.text.primary }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>System Health & Logs</h1>
        <p style={{ color: theme.palette.text.secondary }}>Real-time monitoring of ML pipeline and camera connectivity.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {[
          { label: 'Camera Uptime', value: stats.uptime, icon: <ShieldCheck size={20} />, color: theme.palette.success.main },
          { label: 'ML Service', value: mlHealth ? 'Healthy' : 'Offline', icon: <Cpu size={20} />, color: mlHealth ? theme.palette.success.main : theme.palette.error.main },
          { label: 'Avg Latency', value: stats.processingTime, icon: <Activity size={20} />, color: theme.palette.warning.main },
          { label: 'Total Inferences', value: stats.totalRequests.toLocaleString(), icon: <Terminal size={20} />, color: theme.palette.primary.main },
        ].map((stat, i) => (
          <div key={i} style={{ 
            padding: '1.5rem', 
            backgroundColor: theme.palette.background.paper, 
            borderRadius: '16px', 
            border: `1px solid ${theme.palette.divider}`, 
            boxShadow: theme.shadows[1] 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ padding: '0.5rem', borderRadius: '8px', backgroundColor: `${stat.color}15`, color: stat.color }}>{stat.icon}</div>
              {stat.label === 'ML Service' && (
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: stat.color, boxShadow: `0 0 8px ${stat.color}` }}></div>
              )}
            </div>
            <div style={{ color: theme.palette.text.secondary, fontSize: '0.875rem', fontWeight: 500 }}>{stat.label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.25rem' }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ 
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : '#0f172a', 
        borderRadius: '12px', 
        padding: '1.5rem', 
        color: theme.palette.mode === 'dark' ? theme.palette.text.secondary : '#94a3b8', 
        fontFamily: 'monospace', 
        fontSize: '0.875rem', 
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)', 
        maxHeight: '400px', 
        overflowY: 'auto',
        border: `1px solid ${theme.palette.divider}`
      }}>
        <div style={{ 
          borderBottom: `1px solid ${theme.palette.mode === 'dark' ? theme.palette.divider : '#1e293b'}`, 
          paddingBottom: '0.75rem', 
          marginBottom: '1rem', 
          color: theme.palette.mode === 'dark' ? theme.palette.text.primary : '#cbd5e1', 
          fontWeight: 600, 
          display: 'flex', 
          justifyContent: 'space-between' 
        }}>
          <span>LIVE EVENT LOGS</span>
          <span style={{ color: theme.palette.success.main }}>● CONNECTED</span>
        </div>
        
        {logs.length === 0 ? (
          <div style={{ color: theme.palette.text.disabled, textAlign: 'center', padding: '2rem' }}>Waiting for system events...</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} style={{ marginBottom: '0.5rem', display: 'flex', gap: '1rem' }}>
              <span style={{ color: theme.palette.text.disabled }}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
              <span style={{ color: log.source_type === 'Live' ? theme.palette.success.main : theme.palette.info.main }}>{log.source_type.toUpperCase()}</span>
              <span style={{ color: theme.palette.mode === 'dark' ? theme.palette.text.primary : '#e2e8f0' }}>
                {log.source_type === 'Upload' && log.metadata?.filename && `[${log.metadata.filename}] `}
                Detected {log.results.length} objects 
                {log.results.length > 0 && ` (${log.results.map((r: any) => r.class).join(', ')})`}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SystemStatus;
