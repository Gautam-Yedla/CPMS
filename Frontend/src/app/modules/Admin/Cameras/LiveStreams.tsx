import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, useTheme, useMediaQuery } from '@mui/material';
import { Activity, AlertCircle, Camera as CameraIcon } from 'lucide-react';
import { api } from '../../../utils/services/api';

interface Detection {
  type: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface IParkingSlot {
  id: string;
  occupied: boolean;
  status?: string;
  coordinates?: { x: number; y: number }[];
  slotId?: string;
  [key: string]: unknown;
}

interface IParkingData {
  available: number;
  totalSlots: number;
  occupied: number;
  slots: IParkingSlot[];
  [key: string]: unknown;
}

const LiveStreams: React.FC = () => {
  const theme = useTheme();
  const isTinyMobile = useMediaQuery('(max-width:340px)');
  const isSmallMobile = useMediaQuery('(max-width:400px)');
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [parking, setParking] = useState<IParkingData | null>(null);
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
            setDetections(results.vehicles || []);
            setParking(results.parking || null);
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
        
        detections.forEach((det: Detection) => {
          if (!det.boundingBox) return;
          const { x: x1, y: y1, width, height } = det.boundingBox;
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 3;
          ctx.strokeRect(x1, y1, width, height);
          
          ctx.fillStyle = '#00ff00';
          ctx.font = 'bold 16px Inter, sans-serif';
          ctx.fillText(`${det.type} (${Math.round(det.confidence * 100)}%)`, x1, y1 > 20 ? y1 - 5 : y1 + 20);
        });

        if (parking && parking.slots) {
          parking.slots.forEach((slot: IParkingSlot) => {
            if (!slot.coordinates || slot.coordinates.length === 0) return;
            
            const isOccupied = slot.status === 'occupied';
            ctx.strokeStyle = isOccupied ? 'rgba(255, 0, 0, 0.8)' : 'rgba(0, 255, 0, 0.8)';
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            const startPoint = slot.coordinates[0];
            ctx.moveTo(startPoint.x, startPoint.y);
            for (let i = 1; i < slot.coordinates.length; i++) {
              ctx.lineTo(slot.coordinates[i].x, slot.coordinates[i].y);
            }
            ctx.closePath();
            ctx.stroke();
            
            ctx.fillStyle = isOccupied ? 'rgba(255, 0, 0, 0.2)' : 'rgba(0, 255, 0, 0.2)';
            ctx.fill();

            ctx.fillStyle = isOccupied ? '#ff4444' : '#44ff44';
            ctx.font = 'bold 12px Inter, sans-serif';
            ctx.fillText(`P${slot.slotId}`, startPoint.x + 5, startPoint.y + 15);
          });
        }
      }
    }
  }, [detections, parking]);

  return (
    <Box sx={{ 
      p: isTinyMobile ? 1.25 : isSmallMobile ? 1.5 : isMobile ? 2 : 3,
      maxWidth: '100vw',
      overflowX: 'hidden',
      boxSizing: 'border-box'
    }}>
      {/* Header */}
      <Box mb={isTinyMobile ? 2 : 3}>
        <Box 
          display="flex" 
          flexDirection={isMobile ? 'column' : 'row'}
          justifyContent="space-between" 
          alignItems={isMobile ? 'flex-start' : 'flex-end'}
          gap={isMobile ? 2 : 1}
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
              Live Camera Streams
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, opacity: 0.9 }}>
              Monitor real-time feeds and ML detections across campus.
            </Typography>
          </Box>

          {/* Controls */}
          <Box 
            display="flex" 
            flexDirection={isTinyMobile ? 'column' : 'row'}
            gap={1} 
            alignItems={isTinyMobile ? 'stretch' : 'center'}
            width={isMobile ? '100%' : 'auto'}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '0.5rem', 
              padding: isTinyMobile ? '0.4rem 0.75rem' : '0.5rem 1rem', 
              borderRadius: '20px', 
              backgroundColor: mlStatus === 'Online' 
                ? (theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.1)' : '#dcfce7') 
                : (theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.1)' : '#fee2e2'),
              color: mlStatus === 'Online' ? theme.palette.success.main : theme.palette.error.main,
              fontSize: isTinyMobile ? '0.75rem' : '0.8rem',
              fontWeight: 600,
              flexShrink: 0,
              whiteSpace: 'nowrap'
            }}>
              <Activity size={isTinyMobile ? 14 : 16} />
              ML: {mlStatus}
            </div>
            <button 
              onClick={isStreaming ? stopStream : startStream}
              style={{ 
                padding: isTinyMobile ? '0.6rem 1rem' : '0.75rem 1.25rem', 
                borderRadius: '12px', 
                backgroundColor: isStreaming ? theme.palette.error.main : theme.palette.primary.main,
                color: 'white',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontSize: isTinyMobile ? '0.8rem' : '0.875rem',
                boxShadow: `0 8px 16px ${isStreaming ? theme.palette.error.main : theme.palette.primary.main}40`
              }}
            >
              {isStreaming ? 'Stop Stream' : 'Start My Webcam'}
            </button>
          </Box>
        </Box>
      </Box>

      {/* Error */}
      {error && (
        <Box sx={{ 
          p: isTinyMobile ? 1 : 1.5, 
          bgcolor: `${theme.palette.error.main}10`, 
          color: theme.palette.error.main, 
          borderRadius: '12px', 
          mb: 2, 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          border: `1px solid ${theme.palette.error.main}30`,
          fontSize: isTinyMobile ? '0.8rem' : '0.875rem'
        }}>
          <AlertCircle size={isTinyMobile ? 16 : 20} />
          {error}
        </Box>
      )}

      {/* Video Feed */}
      <Box sx={{ 
        aspectRatio: '16/9', 
        bgcolor: theme.palette.mode === 'dark' ? '#000000' : '#0f172a', 
        borderRadius: isTinyMobile ? '12px' : '16px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: theme.shadows[4],
        border: `1px solid ${theme.palette.divider}`
      }}>
        {!isStreaming && (
          <Box sx={{ 
            position: 'absolute', 
            inset: 0, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: theme.palette.text.disabled 
          }}>
            <CameraIcon size={isTinyMobile ? 32 : 48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <Typography fontWeight={600} sx={{ fontSize: isTinyMobile ? '0.9rem' : '1.125rem' }}>
              Stream Inactive
            </Typography>
          </Box>
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

        {/* Live indicator overlay */}
        <Box sx={{ 
          position: 'absolute', 
          top: isTinyMobile ? '0.5rem' : '1rem', 
          left: isTinyMobile ? '0.5rem' : '1rem',
          bgcolor: 'rgba(0,0,0,0.6)',
          py: 0.5,
          px: 1,
          borderRadius: '20px',
          fontSize: isTinyMobile ? '0.6rem' : '0.75rem',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <Box sx={{ 
            width: isTinyMobile ? 6 : 8, 
            height: isTinyMobile ? 6 : 8, 
            borderRadius: '50%', 
            bgcolor: isStreaming ? theme.palette.error.main : theme.palette.text.disabled,
            animation: isStreaming ? 'pulse 2s infinite' : 'none'
          }} />
          {isStreaming ? 'LIVE' : 'OFFLINE'} {isTinyMobile ? '' : '| WebCam-01'}
        </Box>

        {/* Parking status overlay */}
        {parking && (
          <Box sx={{
            position: 'absolute',
            top: isTinyMobile ? '0.5rem' : '1rem',
            right: isTinyMobile ? '0.5rem' : '1rem',
            bgcolor: 'rgba(0,0,0,0.7)',
            p: isTinyMobile ? 0.75 : 1,
            borderRadius: '8px',
            color: 'white',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: 0.25
          }}>
            <Typography sx={{ fontSize: isTinyMobile ? '0.55rem' : '0.7rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
              PARKING
            </Typography>
            <Box display="flex" gap={isTinyMobile ? 0.75 : 1}>
              <Typography sx={{ fontSize: isTinyMobile ? '0.7rem' : '0.8rem', fontWeight: 700, color: theme.palette.success.light }}>
                {parking.available} Free
              </Typography>
              <Typography sx={{ fontSize: isTinyMobile ? '0.7rem' : '0.8rem', fontWeight: 700, color: theme.palette.error.light }}>
                {parking.occupied} Full
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(0.95); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.8; }
        }
      `}</style>
    </Box>
  );
};

export default LiveStreams;
