import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Upload, FileVideo, FileImage, Loader2, CheckCircle2, AlertCircle, RefreshCw, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { api } from '../../../utils/services/api';
import { supabase } from '../../../utils/lib/supabase';
import { useTheme } from '@mui/material/styles';
import { IRootState } from '@app/appReducer';
import { 
  SET_FILE_STATUS, 
  MERGE_FILE_STATUSES, 
  CLEAR_STATUSES, 
  SET_HISTORY, 
  ADD_HISTORY_ITEM 
} from './mediaReducer';

// Inline canvas component for rendering result images with overlays
const ResultImageCanvas: React.FC<{ data: { image: string; parking: any; detections: any[] } }> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !data.image) return;
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

      // Draw vehicle bounding boxes
      (data.detections || []).forEach((det: any) => {
        if (!det.boundingBox) return;
        const { x, y, width, height } = det.boundingBox;
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = scaledLineWidth;
        ctx.strokeRect(x, y, width, height);
        ctx.fillStyle = '#00ff00';
        ctx.font = `bold ${scaledFontSize}px Inter, sans-serif`;
        ctx.fillText(`${det.type || det.class} (${Math.round(det.confidence * 100)}%)`, x, y > scaledFontSize + 5 ? y - (scaledFontSize / 2) : y + scaledFontSize + 5);
      });

      // Draw parking slot overlays
      if (data.parking?.slots) {
        data.parking.slots.forEach((slot: any) => {
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
          ctx.fillStyle = isOccupied ? '#ff4444' : '#44ff44';
          ctx.font = `bold ${Math.max(10, Math.round(16 * baseScale))}px Inter, sans-serif`;
          ctx.fillText(`P${slot.slotId}`, startPoint.x + 5, startPoint.y + Math.max(10, Math.round(16 * baseScale)));
        });
      }
    };
    img.src = data.image;
  }, [data]);

  return (
    <div style={{ marginTop: '0.75rem', backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
      <canvas ref={canvasRef} style={{ maxWidth: '100%', maxHeight: '50vh', objectFit: 'contain' }} />
    </div>
  );
};


const MediaUploads: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();

  // Use global Redux state for persistence across navigation
  const { fileStatuses, recentUploads } = useSelector((state: IRootState) => state.app.media);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [detectionType, setDetectionType] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [imageCache, setImageCache] = useState<Record<string, { image: string; parking: any; detections: any[] }>>({}); 
  const [loadingImage, setLoadingImage] = useState<string | null>(null);

  // Fetch full history from database
  const fetchHistory = useCallback(async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase
        .from('camera_detections')
        .select('*')
        .eq('source_type', 'Upload')
        .order('timestamp', { ascending: false })
        .limit(20);

      if (error) throw error;

      const formattedHistory = (data || []).map((row: any) => {
        let metadata = row.metadata;
        let results = row.results;
        if (typeof metadata === 'string') { try { metadata = JSON.parse(metadata); } catch(e) {} }
        if (typeof results === 'string') { try { results = JSON.parse(results); } catch(e) {} }
        
        const resultsCount = Array.isArray(results) ? results.length : 0;
        const parkingOccupied = metadata?.parking?.occupied || 0;
        
        return {
          id: row.id,
          name: metadata?.filename || 'Unknown',
          size: metadata?.is_video ? `${metadata?.frames_processed} Frames` : 'Single Image',
          time: new Date(row.timestamp).toLocaleString(),
          detections: resultsCount > 0 ? resultsCount : parkingOccupied,
          isVideo: metadata?.is_video,
          availableSlots: metadata?.parking?.available,
          totalSlots: metadata?.parking?.totalSlots
        };
      });

      dispatch({ type: SET_HISTORY, history: formattedHistory });
      
      // Also update any matching file statuses to 'done'
      formattedHistory.forEach(item => {
        dispatch({ type: SET_FILE_STATUS, name: item.name, status: 'done' });
      });
    } catch (err: any) {
      console.error('Failed to fetch history:', err);
    } finally {
      setSyncing(false);
    }
  }, [dispatch]);

  const processFiles = async (files: File[]) => {
    if (files.length === 0) return;

    setError(null);
    setUploading(true);
    
    // Initial statuses in Redux
    const initial: Record<string, 'pending'> = {};
    files.forEach(f => initial[f.name] = 'pending');
    dispatch({ type: MERGE_FILE_STATUSES, statuses: initial });

    const formData = new FormData();
    files.forEach(file => formData.append('media', file));
    formData.append('location', 'Manual Batch');
    formData.append('detectionType', detectionType);

    try {
      await api.uploadMedia(formData);
      
      // Mark as processing once enqueued
      const processing: Record<string, 'processing'> = {};
      files.forEach(f => processing[f.name] = 'processing');
      dispatch({ type: MERGE_FILE_STATUSES, statuses: processing });

      setUploading(false);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err.message || 'Failed to start batch processing.');
      setUploading(false);
      
      const errors: Record<string, 'error'> = {};
      files.forEach(f => errors[f.name] = 'error');
      dispatch({ type: MERGE_FILE_STATUSES, statuses: errors });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await processFiles(files);
    if (e.target) e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    await processFiles(files);
  };

  useEffect(() => {
    // 1. Sync history on mount
    fetchHistory();

    // 2. Listen for realtime deletions/results
    const channel = supabase
      .channel('upload-detections-global')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'camera_detections' },
        (payload: any) => {
          console.log('[MediaUploads] Realtime INSERT event:', payload);
          const newDoc = payload.new;
          if (newDoc.source_type !== 'Upload') {
            console.log('[MediaUploads] Skipping non-Upload source:', newDoc.source_type);
            return;
          }
          
          let metadata = newDoc.metadata;
          let results = newDoc.results;
          if (typeof metadata === 'string') { try { metadata = JSON.parse(metadata); } catch(e) {} }
          if (typeof results === 'string') { try { results = JSON.parse(results); } catch(e) {} }
          
          const filename = metadata?.filename;
          console.log('[MediaUploads] Processing upload for filename:', filename);
          
          if (filename) {
            // Update status in Redux
            console.log('[MediaUploads] Dispatching SET_FILE_STATUS to "done" for:', filename);
            dispatch({ type: SET_FILE_STATUS, name: filename, status: 'done' });

            // Add to history in Redux
            const resultsCount = Array.isArray(results) ? results.length : 0;
            const parkingOccupied = metadata?.parking?.occupied || 0;
            dispatch({ 
              type: ADD_HISTORY_ITEM, 
              item: { 
                id: newDoc.id,
                name: filename, 
                size: metadata?.is_video ? `${metadata?.frames_processed} Frames` : 'Single Image', 
                time: new Date(newDoc.timestamp).toLocaleString(), 
                detections: resultsCount > 0 ? resultsCount : parkingOccupied,
                isVideo: metadata?.is_video,
                availableSlots: metadata?.parking?.available,
                totalSlots: metadata?.parking?.totalSlots
              } 
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('[MediaUploads] Realtime subscription status:', status);
      });

    return () => {
      console.log('[MediaUploads] Cleaning up Realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [dispatch]);

  return (
    <div style={{ padding: '2rem', color: theme.palette.text.primary }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>Batch Media Hub</h1>
        <p style={{ color: theme.palette.text.secondary }}>Upload multiple files for individual background ML analysis. Progress persists if you leave the page.</p>
      </header>

      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
        backgroundColor: isDragging ? (theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff') : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'),
        border: `2px dashed ${isDragging ? theme.palette.primary.main : theme.palette.divider}`,
        borderRadius: '16px',
        padding: '3rem 2rem',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s',
        position: 'relative',
      }}>
        <input 
          type="file" 
          multiple
          onChange={handleFileUpload} 
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} 
        />
        <Upload size={48} style={{ color: uploading ? theme.palette.primary.main : theme.palette.text.disabled, marginBottom: '1.5rem', margin: '0 auto' }} />
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          {uploading ? 'Adding to queue...' : 'Select multiple images or videos'}
        </h3>
        <p style={{ color: theme.palette.text.secondary, fontSize: '0.875rem' }}>Individual results will be stored permanently in the history below.</p>
      </div>

      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        {[
          { id: 'all', label: 'All Features (Native)' },
          { id: 'vehicles', label: 'Vehicles Only' },
          { id: 'parking', label: 'Parking Slots Only' }
        ].map((type) => (
          <button
            key={type.id}
            onClick={() => setDetectionType(type.id)}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '24px',
              border: `1px solid ${detectionType === type.id ? theme.palette.primary.main : theme.palette.divider}`,
              backgroundColor: detectionType === type.id ? (theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff') : 'transparent',
              color: detectionType === type.id ? theme.palette.primary.main : theme.palette.text.secondary,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {type.label}
          </button>
        ))}
      </div>


      {Object.keys(fileStatuses).length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Active Status Tracking</h3>
            <button 
              onClick={() => dispatch({ type: CLEAR_STATUSES })}
              style={{ fontSize: '0.75rem', color: theme.palette.primary.main, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Clear Tracker
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {Object.entries(fileStatuses).map(([name, status]) => {
              return (
              <div key={name} style={{ 
                padding: '0.5rem 1rem', 
                backgroundColor: status === 'done' ? (theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.1)' : '#dcfce7') : 
                                 status === 'processing' || status === 'pending' ? (theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff') : 
                                 (theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.1)' : '#fee2e2'),
                borderRadius: '20px',
                fontSize: '0.8125rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                border: `1px solid ${status === 'done' ? theme.palette.success.main : 
                                    status === 'processing' || status === 'pending' ? theme.palette.primary.main : 
                                    theme.palette.error.main}`
              }}>
                {(status === 'processing' || status === 'pending') && <Loader2 size={14} className="animate-spin" />}
                {status === 'done' && <CheckCircle2 size={14} color={theme.palette.success.main} />}
                {status === 'error' && <AlertCircle size={14} color={theme.palette.error.main} />}
                <span style={{ fontWeight: 500, color: theme.palette.text.primary }}>{name}</span>
                <span style={{ color: theme.palette.text.secondary, fontSize: '0.75rem', textTransform: 'uppercase' }}>{status}</span>
              </div>
            )})}
          </div>
        </div>
      )}

      {error && (
        <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: theme.palette.error.light, color: theme.palette.error.main, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: theme.palette.mode === 'dark' ? 0.8 : 1 }}>
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      <div style={{ marginTop: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Permanent Processing History</h3>
          <button 
            onClick={fetchHistory}
            disabled={syncing}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem', 
              fontSize: '0.75rem', 
              color: theme.palette.primary.main, 
              background: 'none', 
              border: 'none', 
              cursor: syncing ? 'default' : 'pointer',
              opacity: syncing ? 0.5 : 1
            }}
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing...' : 'Refresh History'}
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {recentUploads.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: theme.palette.text.disabled, border: `1px solid ${theme.palette.divider}`, borderRadius: '12px' }}>
              No processing records found.
            </div>
          ) : (
            recentUploads.map((item) => (
              <div key={item.id} style={{ backgroundColor: theme.palette.background.paper, borderRadius: '12px', border: `1px solid ${theme.palette.divider}`, overflow: 'hidden' }}>
                <div 
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', cursor: 'pointer', transition: 'background 0.15s' }}
                  className="hover-bg"
                  onClick={async () => {
                    if (expandedId === item.id) {
                      setExpandedId(null);
                      return;
                    }
                    setExpandedId(item.id);
                    if (!imageCache[item.id]) {
                      setLoadingImage(item.id);
                      try {
                        const { data } = await supabase
                          .from('camera_detections')
                          .select('metadata, results')
                          .eq('id', item.id)
                          .single();
                        if (data) {
                          let metadata = data.metadata;
                          let results = data.results;
                          if (typeof metadata === 'string') { try { metadata = JSON.parse(metadata); } catch(e) {} }
                          if (typeof results === 'string') { try { results = JSON.parse(results); } catch(e) {} }
                          const mime = metadata?.mimeType || 'image/jpeg';
                          const b64 = metadata?.original_image_base64;
                          if (b64) {
                            const imgSrc = b64.startsWith('data:') ? b64 : `data:${mime};base64,${b64}`;
                            setImageCache(prev => ({ ...prev, [item.id]: { image: imgSrc, parking: metadata?.parking, detections: Array.isArray(results) ? results : [] } }));
                          }
                        }
                      } catch (err) {
                        console.error('Failed to load image:', err);
                      } finally {
                        setLoadingImage(null);
                      }
                    }
                  }}
                >
                  <div style={{ padding: '0.5rem', backgroundColor: theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.1)' : '#e0e7ff', color: theme.palette.primary.main, borderRadius: '8px' }}>
                    {!item.isVideo ? <FileImage size={20} /> : <FileVideo size={20} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: theme.palette.text.primary, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {item.name}
                      <Eye size={14} style={{ color: theme.palette.text.secondary }} />
                    </div>
                    <div style={{ fontSize: '0.75rem', color: theme.palette.text.secondary }}>{item.size} • {item.time}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', backgroundColor: theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.1)' : '#dcfce7', color: theme.palette.success.main, borderRadius: '4px', fontWeight: 700 }}>
                        {item.detections} {item.totalSlots ? (item.detections === item.totalSlots - item.availableSlots ? 'Occupied' : 'Vehicles') : 'Objects'}
                      </span>
                      {item.availableSlots !== undefined && (
                        <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', padding: '0.25rem 0.6rem', backgroundColor: theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff', color: theme.palette.primary.main, borderRadius: '4px', fontWeight: 700 }}>
                          {item.availableSlots}/{item.totalSlots} Slots Free
                        </span>
                      )}
                    </div>
                    {expandedId === item.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>

                {expandedId === item.id && (
                  <div style={{ padding: '0 1rem 1rem', borderTop: `1px solid ${theme.palette.divider}` }}>
                    {loadingImage === item.id ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', color: theme.palette.text.secondary }}>
                        <Loader2 size={20} className="animate-spin" style={{ marginRight: '0.5rem' }} /> Loading image...
                      </div>
                    ) : imageCache[item.id] ? (
                      <ResultImageCanvas data={imageCache[item.id]} />
                    ) : (
                      <div style={{ padding: '2rem', textAlign: 'center', color: theme.palette.text.disabled }}>
                        No image data available for this record.
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default MediaUploads;
