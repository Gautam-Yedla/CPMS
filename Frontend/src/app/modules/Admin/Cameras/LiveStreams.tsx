import React, { useEffect, useRef, useState } from 'react';
import { Activity, AlertCircle, Camera as CameraIcon } from 'lucide-react';
import { api } from '../../../utils/services/api';
import { useTheme } from '@mui/material/styles';

interface Detection {
  bbox: number[];
  confidence: number;
  class: string;
}

const LiveStreams: React.FC = () => {
  const theme = useTheme();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mlStatus, setMlStatus] = useState<'Online' | 'Offline'>('Offline');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const { mlService } = await api.fetchStreamHealth();
        setMlStatus(mlService);
      } catch (err) {
        setMlStatus('Offline');
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const startStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
        setError(null);
      }
    } catch (err) {
      setError('Failed to access camera. Please ensure permissions are granted.');
    }
  };

  const stopStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
    }
  };

  useEffect(() => {
    let animationFrame: number;
    const processFrame = async () => {
      if (isStreaming && videoRef.current && canvasRef.current && mlStatus === 'Online') {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const base64 = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];

          try {
            const results = await api.processStreamFrame('WEB-CAM-01', base64);
            setDetections(results.detections);
          } catch (err) {
            console.error('Frame processing failed:', err);
          }
        }
      }
      setTimeout(() => {
        animationFrame = requestAnimationFrame(processFrame);
      }, 500);
    };

    if (isStreaming) {
      processFrame();
    }
    return () => cancelAnimationFrame(animationFrame);
  }, [isStreaming, mlStatus]);

  useEffect(() => {
    if (canvasRef.current && videoRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        detections.forEach((det) => {
          const [x1, y1, x2, y2] = det.bbox;
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 3;
          ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
          
          ctx.fillStyle = '#00ff00';
          ctx.font = 'bold 16px Inter, sans-serif';
          ctx.fillText(`${det.class} (${Math.round(det.confidence * 100)}%)`, x1, y1 > 20 ? y1 - 5 : y1 + 20);
        });
      }
    }
  }, [detections]);

  return (
    <div style={{ padding: '2rem', color: theme.palette.text.primary }}>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>Live Camera Streams</h1>
          <p style={{ color: theme.palette.text.secondary }}>Monitor real-time feeds and ML detections across campus.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            padding: '0.5rem 1rem', 
            borderRadius: '20px', 
            backgroundColor: mlStatus === 'Online' ? (theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.1)' : '#dcfce7') : (theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.1)' : '#fee2e2'),
            color: mlStatus === 'Online' ? theme.palette.success.main : theme.palette.error.main,
            fontSize: '0.875rem',
            fontWeight: 600
          }}>
            <Activity size={16} />
            ML Service: {mlStatus}
          </div>
          <button 
            onClick={isStreaming ? stopStream : startStream}
            style={{ 
              padding: '0.75rem 1.5rem', 
              borderRadius: '8px', 
              backgroundColor: isStreaming ? theme.palette.error.main : theme.palette.primary.main,
              color: 'white',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {isStreaming ? 'Stop Stream' : 'Start My Webcam'}
          </button>
        </div>
      </header>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: theme.palette.error.light, color: theme.palette.error.main, borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: theme.palette.mode === 'dark' ? 0.8 : 1 }}>
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(640px, 1fr))', 
        gap: '1.5rem' 
      }}>
        <div style={{ 
          aspectRatio: '16/9', 
          backgroundColor: theme.palette.mode === 'dark' ? '#000000' : '#0f172a', 
          borderRadius: '12px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: theme.shadows[4],
          border: `1px solid ${theme.palette.divider}`
        }}>
          {!isStreaming && (
            <div style={{ 
              position: 'absolute', 
              inset: 0, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: theme.palette.text.disabled 
            }}>
              <CameraIcon size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <span style={{ fontSize: '1.125rem', fontWeight: 600 }}>Stream Inactive</span>
            </div>
          )}
          
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
              display: isStreaming ? 'block' : 'none'
            }} 
          />
          
          <canvas 
            ref={canvasRef} 
            width={640} 
            height={360}
            style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              width: '100%', 
              height: '100%',
              pointerEvents: 'none'
            }} 
          />

          <div style={{ 
            position: 'absolute', 
            top: '1rem', 
            left: '1rem',
            backgroundColor: 'rgba(0,0,0,0.6)',
            padding: '0.4rem 0.8rem',
            borderRadius: '20px',
            fontSize: '0.75rem',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              backgroundColor: isStreaming ? theme.palette.error.main : theme.palette.text.disabled,
              animation: isStreaming ? 'pulse 2s infinite' : 'none'
            }}></div>
            {isStreaming ? 'LIVE' : 'OFFLINE'} | WebCam-01 (Faculty Gate)
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

export default LiveStreams;
