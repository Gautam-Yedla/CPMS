import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../../utils/lib/supabase';
import { useTheme } from '@mui/material/styles';
import { X, Play, Image as ImageIcon, Loader2 } from 'lucide-react';

interface ProcessingPreviewProps {
  filename: string;
  onClose: () => void;
  status?: 'pending' | 'processing' | 'done' | 'error';
}

const sanitizeChannelName = (name: string) => {
  return name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
};

const ProcessingPreview: React.FC<ProcessingPreviewProps> = ({ filename, onClose, status }) => {
  const theme = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentFrame, setCurrentFrame] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [detections, setDetections] = useState<any[]>([]);
  const [parking, setParking] = useState<any>(null);
  const [fetchingResult, setFetchingResult] = useState(false);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let isActive = true;

    const fetchResult = async () => {
      setFetchingResult(true);
      try {
        const { data } = await supabase
          .from('camera_detections')
          .select('*')
          .eq('source_type', 'Upload')
          .filter('metadata->>filename', 'eq', filename)
          .order('timestamp', { ascending: false })
          .limit(1)
          .single();

        if (isActive && data) {
          let metadata = data.metadata;
          let results = data.results;
          if (typeof metadata === 'string') { try { metadata = JSON.parse(metadata); } catch(e) {} }
          if (typeof results === 'string') { try { results = JSON.parse(results); } catch(e) {} }

          setDetections(results || []);
          if (metadata?.parking) {
            setParking(metadata.parking);
          }
          if (metadata?.original_image_base64) {
            // Reconstruct the image so the canvas can draw the bounding boxes over it
            const mime = metadata?.mimeType || 'image/jpeg';
            const b64 = metadata.original_image_base64;
            
            console.log("BASE64 DEBUG - Prefix:", b64.substring(0, 50));
            console.log("BASE64 DEBUG - Mime:", mime);
            
            const finalImageStr = b64.startsWith('data:') ? b64 : `data:${mime};base64,${b64}`;
            setCurrentFrame(finalImageStr);
          } else {
            console.warn("BASE64 DEBUG - original_image_base64 is missing from DB metadata for id:", data.id);
          }
          setProgress({ current: 1, total: 1 });
        }
      } catch (err) {
        console.error('Error fetching static result:', err);
      } finally {
        if (isActive) setFetchingResult(false);
      }
    };

    if (status === 'done') {
      fetchResult();
    } else {
      // Listen for live updates
      const sanitizedName = sanitizeChannelName(filename);
      const channelName = `streaming-${sanitizedName}`;
      channel = supabase
        .channel(channelName)
        .on('broadcast', { event: 'frame' }, ({ payload }) => {
          if (!isActive) return;
          setCurrentFrame(payload.frame);
          setDetections(payload.detections || []);
          if (payload.parking) setParking(payload.parking);
          setProgress({ current: payload.current, total: payload.total });
        })
        .subscribe();
    }

    return () => {
      isActive = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [filename, status]);

  useEffect(() => {
    if (currentFrame && canvasRef.current) {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const baseScale = Math.max(img.width, img.height) / 1000;
        const scaledLineWidth = Math.max(1, Math.round(3 * baseScale));
        const scaledFontSize = Math.max(10, Math.round(20 * baseScale));

        detections.forEach((det: any) => {
          if (!det.boundingBox) return;
          const { x: x1, y: y1, width, height } = det.boundingBox;
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = scaledLineWidth;
          ctx.strokeRect(x1, y1, width, height);
          
          ctx.fillStyle = '#00ff00';
          ctx.font = `bold ${scaledFontSize}px Inter, sans-serif`;
          ctx.fillText(`${det.type || det.class} (${Math.round(det.confidence * 100)}%)`, x1, y1 > scaledFontSize + 5 ? y1 - (scaledFontSize / 2) : y1 + scaledFontSize + 5);
        });

        if (parking && parking.slots) {
          parking.slots.forEach((slot: any) => {
            const isOccupied = slot.status === 'occupied';
            ctx.strokeStyle = isOccupied ? 'rgba(255, 0, 0, 0.8)' : 'rgba(0, 255, 0, 0.8)';
            ctx.lineWidth = Math.max(1, Math.round(2 * baseScale));
            
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

            // Label
            ctx.fillStyle = isOccupied ? '#ff4444' : '#44ff44';
            ctx.font = `bold ${Math.max(10, Math.round(16 * baseScale))}px Inter, sans-serif`;
            ctx.fillText(`P${slot.slotId}`, startPoint.x + 5, startPoint.y + Math.max(10, Math.round(16 * baseScale)));
          });
        }
      };
      img.src = currentFrame;
    }
  }, [currentFrame, detections, parking]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      backdropFilter: 'blur(8px)',
      padding: '2rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1000px',
        backgroundColor: theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        position: 'relative'
      }}>
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
              {status === 'done' ? 'Detection Results' : 'Live Analysis Preview'}
            </h3>
            <span style={{ fontSize: '0.875rem', color: theme.palette.text.secondary }}>{filename}</span>
          </div>
          <button onClick={onClose} style={{ 
            background: 'none', 
            border: 'none', 
            color: theme.palette.text.secondary, 
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '50%'
          }} className="hover-bg">
            <X size={24} />
          </button>
        </div>

        <div style={{ padding: '1.5rem', backgroundColor: '#000', display: 'flex', justifyContent: 'center' }}>
          {!currentFrame ? (
            <div style={{ height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              {fetchingResult ? (
                 <Loader2 size={40} className="animate-spin" />
              ) : (
                <div className="animate-spin" style={{ marginBottom: '1rem' }}><Play size={40} /></div>
              )}
              <span>{status === 'done' ? 'Loading saved result...' : 'Connecting to stream...'}</span>
              <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
                {status === 'done' ? 'Retrieving metadata from database.' : 'Server starts broadcasting after a brief buffer.'}
              </p>
            </div>
          ) : (
            <canvas 
              ref={canvasRef} 
              style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: '8px', objectFit: 'contain' }} 
            />
          )}
        </div>

        <div style={{ padding: '1.25rem 1.5rem', backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : '#f8fafc' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: status === 'done' ? theme.palette.success.main : theme.palette.info.main, fontWeight: 700, fontSize: '0.875rem' }}>
              {status === 'done' ? <ImageIcon size={18} /> : (
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'currentColor', animation: 'pulse 2s infinite' }}></div>
              )}
              {status === 'done' ? 'PROCESSING COMPLETE' : 'BROADCASTING LIVE'}
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: theme.palette.text.secondary }}>
              {parking && <span style={{ marginRight: '1rem', color: theme.palette.primary.main }}>{parking.available}/{parking.totalSlots} Slots Free</span>}
              {status === 'done' ? `100% Processed` : `Frame ${progress.current} of ${progress.total}`}
            </div>
          </div>
          <div style={{ height: '6px', backgroundColor: theme.palette.divider, borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ 
              height: '100%', 
              width: status === 'done' ? '100%' : `${(progress.current / progress.total) * 100}%`, 
              backgroundColor: status === 'done' ? theme.palette.success.main : theme.palette.primary.main, 
              transition: 'width 0.3s ease' 
            }}></div>
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {detections.length === 0 ? (
              parking && parking.slots ? (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ padding: '0.2rem 0.6rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                    {parking.occupied} Occupied
                  </span>
                  <span style={{ padding: '0.2rem 0.6rem', backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                    {parking.available} Available
                  </span>
                </div>
              ) : (
                <span style={{ fontSize: '0.75rem', color: theme.palette.text.disabled }}>
                  {status === 'done' ? 'No items detected.' : 'Identifying objects...'}
                </span>
              )
            ) : (
              detections.map((det, i) => (
                <span key={i} style={{ 
                  padding: '0.2rem 0.6rem', 
                  backgroundColor: theme.palette.primary.main + '20', 
                  color: theme.palette.primary.main, 
                  borderRadius: '4px', 
                  fontSize: '0.75rem', 
                  fontWeight: 700 
                }}>
                  {det.type || det.class || det}
                </span>
              ))
            )}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.5; }
          50% { opacity: 1; }
          100% { opacity: 0.5; }
        }
        .animate-spin { animation: spin 2s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default ProcessingPreview;
