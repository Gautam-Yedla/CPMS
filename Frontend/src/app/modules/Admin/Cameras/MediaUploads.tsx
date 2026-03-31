import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Upload, FileVideo, FileImage, Loader2, CheckCircle2, AlertCircle, RefreshCw, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { api } from '../../../utils/services/api';
import { supabase } from '../../../utils/lib/supabase';
import { useTheme, useMediaQuery, Box, Typography, Paper } from '@mui/material';
import { IRootState } from '@app/appReducer';
import { 
  SET_FILE_STATUS, 
  MERGE_FILE_STATUSES, 
  CLEAR_STATUSES, 
  SET_HISTORY, 
  ADD_HISTORY_ITEM 
} from './mediaReducer';

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

interface MediaMetadata {
  filename: string;
  is_video: boolean;
  frames_processed?: number;
  parking?: IParkingData;
  [key: string]: unknown;
}

interface IParkingSlot {
  id: string;
  occupied: boolean;
  coordinates?: Array<{ x: number; y: number }>;
  status?: string;
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

interface IHistoryItem {
  id: string;
  metadata: string | Record<string, unknown>;
  results: string | unknown[];
  timestamp: string;
  [key: string]: unknown;
}

// Inline canvas component for rendering result images with overlays
const ResultImageCanvas: React.FC<{ data: { image: string; parking: IParkingData; detections: Detection[] } }> = ({ data }) => {
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
      (data.detections || []).forEach((det: Detection) => {
        if (!det.boundingBox) return;
        const { x, y, width, height } = det.boundingBox;
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = scaledLineWidth;
        ctx.strokeRect(x, y, width, height);
        ctx.fillStyle = '#00ff00';
        ctx.font = `bold ${scaledFontSize}px Inter, sans-serif`;
        ctx.fillText(`${det.type} (${Math.round(det.confidence * 100)}%)`, x, y > scaledFontSize + 5 ? y - (scaledFontSize / 2) : y + scaledFontSize + 5);
      });

      // Draw parking slot overlays
      if (data.parking?.slots) {
        data.parking.slots.forEach((slot: IParkingSlot) => {
          if (!slot.coordinates || slot.coordinates.length === 0) return;
          
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
    <Box sx={{ mt: 1.5, bgcolor: '#000', borderRadius: '12px', overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
      <canvas ref={canvasRef} style={{ maxWidth: '100%', maxHeight: '50vh', objectFit: 'contain' }} />
    </Box>
  );
};


const MediaUploads: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const isTinyMobile = useMediaQuery('(max-width:340px)');
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isExtraSmall = useMediaQuery('(max-width:400px)');

  // Use global Redux state for persistence across navigation
  const { fileStatuses, recentUploads } = useSelector((state: IRootState) => state.app.media);

  const statusesCleared = useRef(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [detectionType, setDetectionType] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [imageCache, setImageCache] = useState<Record<string, { image: string; parking: IParkingData; detections: Detection[] }>>({});
  const [loadingImage, setLoadingImage] = useState<string | null>(null);

  // Use ref to avoid re-subscribing when fileStatuses changes
  const fileStatusesRef = useRef(fileStatuses);
  useEffect(() => {
    fileStatusesRef.current = fileStatuses;
  }, [fileStatuses]);

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

      const formattedHistory = (data || []).map((row: IHistoryItem) => {
        let metadata = row.metadata;
        let results = row.results;
        if (typeof metadata === 'string') { try { metadata = JSON.parse(metadata); } catch { /* ignore */ } }
        if (typeof results === 'string') { try { results = JSON.parse(results); } catch { /* ignore */ } }
        
        const resultsCount = Array.isArray(results) ? results.length : 0;
        const parkingOccupied = (metadata && typeof metadata === 'object' && metadata.parking) ? (metadata.parking as IParkingData).occupied || 0 : 0;
        
        return {
          id: row.id,
          name: (metadata && typeof metadata === 'object' && 'filename' in metadata) ? (metadata as MediaMetadata).filename : 'Unknown',
          size: (metadata && typeof metadata === 'object' && 'is_video' in metadata) ? `${(metadata as MediaMetadata).frames_processed || 0} Frames` : 'Single Image',
          time: new Date(row.timestamp).toLocaleString(),
          detections: resultsCount > 0 ? resultsCount : parkingOccupied,
          isVideo: (metadata && typeof metadata === 'object' && 'is_video' in metadata) ? metadata.is_video : false,
          availableSlots: (metadata && typeof metadata === 'object' && metadata.parking) ? (metadata.parking as IParkingData).available : 0,
          totalSlots: (metadata && typeof metadata === 'object' && metadata.parking) ? (metadata.parking as IParkingData).totalSlots : 0
        };
      });

      dispatch({ type: SET_HISTORY, history: formattedHistory });
      
      // Only update statuses for items actively being tracked (not cleared history)
      if (!statusesCleared.current) {
        formattedHistory.forEach(item => {
          if (fileStatusesRef.current[item.name as string] && fileStatusesRef.current[item.name as string] !== 'done') {
            dispatch({ type: SET_FILE_STATUS, name: item.name, status: 'done' });
          }
        });
      }
    } catch {
      console.error('Failed to fetch history');
    } finally {
      setSyncing(false);
    }
  }, [dispatch]);

  const processFiles = async (files: File[]) => {
    if (files.length === 0) return;

    setError(null);
    statusesCleared.current = false;
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
    } catch (err: unknown) {
      console.error('Upload failed:', err);
      setError((err as Error).message || 'Failed to start batch processing.');
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
        (payload: { new: Record<string, unknown> }) => {
          const newDoc = payload.new;
          if (newDoc.source_type !== 'Upload') return;
          
          let metadata = newDoc.metadata;
          let results = newDoc.results;
          if (typeof metadata === 'string') { try { metadata = JSON.parse(metadata); } catch { /* ignore */ } }
          if (typeof results === 'string') { try { results = JSON.parse(results); } catch { /* ignore */ } }
          
          const filename = (metadata as MediaMetadata)?.filename;
          
          if (filename) {
            // Update status in Redux
            if (!statusesCleared.current && fileStatusesRef.current[filename]) {
              dispatch({ type: SET_FILE_STATUS, name: filename, status: 'done' });
            }

            // Add to history in Redux
            const resultsCount = Array.isArray(results) ? results.length : 0;
            const parkingOccupied = (metadata as MediaMetadata)?.parking?.occupied || 0;
            dispatch({ 
              type: ADD_HISTORY_ITEM, 
              item: { 
                id: newDoc.id,
                name: filename, 
                size: (metadata as MediaMetadata)?.is_video ? `${(metadata as MediaMetadata)?.frames_processed} Frames` : 'Single Image', 
                time: new Date(newDoc.timestamp as string).toLocaleString(), 
                detections: resultsCount > 0 ? resultsCount : parkingOccupied,
                isVideo: (metadata as MediaMetadata)?.is_video,
                availableSlots: (metadata as MediaMetadata)?.parking?.available,
                totalSlots: (metadata as MediaMetadata)?.parking?.totalSlots
              } 
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dispatch, fetchHistory]);

  return (
    <Box sx={{ p: isTinyMobile ? 1.25 : isExtraSmall ? 1.5 : isMobile ? 2 : 3, color: theme.palette.text.primary, maxWidth: '100vw', overflowX: 'hidden', boxSizing: 'border-box' }}>
      {/* Header */}
      <Box sx={{ mb: isTinyMobile ? 2 : 3 }}>
        <Typography 
          fontWeight={900} 
          sx={{ 
            fontSize: isTinyMobile ? '1.75rem' : isExtraSmall ? '2.25rem' : '3.25rem', 
            letterSpacing: '-0.03em', 
            lineHeight: 1.1, 
            color: theme.palette.text.primary, 
            mb: 1 
          }}
        >
          Media Uploads
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, opacity: 0.9 }}>
          Upload files for background ML analysis. Progress persists across navigation.
        </Typography>
      </Box>

      {/* Drop Zone */}
      <Box
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        sx={{
          bgcolor: isDragging
            ? (theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff')
            : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
          border: `2px dashed ${isDragging ? theme.palette.primary.main : theme.palette.divider}`,
          borderRadius: '16px',
          p: isExtraSmall ? 3 : isMobile ? 4 : 5,
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
          position: 'relative',
        }}
      >
        <input 
          type="file" 
          multiple
          onChange={handleFileUpload} 
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} 
        />
        <Upload size={isMobile ? 36 : 48} style={{ color: uploading ? theme.palette.primary.main : theme.palette.text.disabled, marginBottom: '1rem', display: 'block', margin: '0 auto 1rem' }} />
        <Typography variant={isMobile ? 'subtitle1' : 'h6'} fontWeight="700" sx={{ mb: 0.5 }}>
          {uploading ? 'Adding to queue...' : 'Select multiple images or videos'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Results will be stored permanently in the history below.
        </Typography>
      </Box>

      {/* Detection Type Selector */}
      <Box sx={{
        mt: 2.5,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 1,
        justifyContent: 'center'
      }}>
        {[
          { id: 'all', label: 'All Features' },
          { id: 'vehicles', label: 'Vehicles Only' },
          { id: 'parking', label: 'Parking Only' }
        ].map((type) => (
          <Box
            key={type.id}
            component="button"
            onClick={() => setDetectionType(type.id)}
            sx={{
              px: isExtraSmall ? 2 : 3,
              py: 1,
              borderRadius: '12px',
              border: `1px solid ${detectionType === type.id ? theme.palette.primary.main : theme.palette.divider}`,
              bgcolor: detectionType === type.id
                ? (theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff')
                : 'transparent',
              color: detectionType === type.id ? theme.palette.primary.main : theme.palette.text.secondary,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontSize: isExtraSmall ? '0.75rem' : '0.8125rem',
              fontFamily: 'inherit',
            }}
          >
            {type.label}
          </Box>
        ))}
      </Box>

      {/* Active Status Tracking */}
      {Object.keys(fileStatuses).length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="subtitle2" fontWeight="800">Active Status Tracking</Typography>
            <Box
              component="button"
              onClick={() => { statusesCleared.current = true; dispatch({ type: CLEAR_STATUSES }); }}
              sx={{ fontSize: '0.75rem', color: theme.palette.primary.main, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}
            >
              Clear
            </Box>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {Object.entries(fileStatuses).map(([name, status]) => (
              <Box key={name} sx={{
                px: 1.5, py: 0.75,
                bgcolor: status === 'done'
                  ? (theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.1)' : '#dcfce7')
                  : status === 'processing' || status === 'pending'
                    ? (theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff')
                    : (theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.1)' : '#fee2e2'),
                borderRadius: '10px',
                fontSize: isExtraSmall ? '0.7rem' : '0.8125rem',
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                border: `1px solid ${status === 'done' ? theme.palette.success.main :
                  status === 'processing' || status === 'pending' ? theme.palette.primary.main :
                    theme.palette.error.main}`,
                maxWidth: '100%',
                overflow: 'hidden',
              }}>
                {(status === 'processing' || status === 'pending') && <Loader2 size={14} className="animate-spin" />}
                {status === 'done' && <CheckCircle2 size={14} color={theme.palette.success.main} />}
                {status === 'error' && <AlertCircle size={14} color={theme.palette.error.main} />}
                <Box component="span" sx={{ fontWeight: 600, color: theme.palette.text.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</Box>
                <Box component="span" sx={{ color: theme.palette.text.secondary, fontSize: '0.7rem', textTransform: 'uppercase', flexShrink: 0 }}>{status}</Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Error Display */}
      {error && (
        <Paper elevation={0} sx={{ mt: 2, p: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.1)' : '#fee2e2', color: theme.palette.error.main, borderRadius: '12px', display: 'flex', alignItems: 'center', gap: 1.5, border: `1px solid ${theme.palette.error.main}30` }}>
          <AlertCircle size={20} />
          <Typography variant="body2" fontWeight={600}>{error}</Typography>
        </Paper>
      )}

      {/* Processing History */}
      <Box sx={{ mt: 5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="subtitle1" fontWeight="900" color="text.primary">Processing History</Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={500}>Recent analysis results from uploaded media.</Typography>
          </Box>
          <Box
            component="button"
            onClick={fetchHistory}
            disabled={syncing}
            sx={{
              display: 'flex', alignItems: 'center', gap: 0.75,
              px: 2, py: 0.75, borderRadius: '10px',
              fontSize: '0.75rem', color: theme.palette.primary.main,
              bgcolor: `${theme.palette.primary.main}0A`,
              border: `1px solid ${theme.palette.primary.main}30`,
              fontFamily: 'inherit',
              cursor: syncing ? 'default' : 'pointer',
              opacity: syncing ? 0.5 : 1, fontWeight: 800,
              transition: 'all 0.2s',
            }}
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing...' : 'Refresh'}
          </Box>
        </Box>

        {recentUploads.length === 0 ? (
          <Paper elevation={0} sx={{ p: 6, textAlign: 'center', border: `1px dashed ${theme.palette.divider}`, borderRadius: '16px', bgcolor: 'transparent' }}>
            <FileImage size={48} style={{ color: theme.palette.text.disabled, marginBottom: 16 }} />
            <Typography variant="subtitle2" fontWeight={800} color="text.secondary">No Processing Records</Typography>
            <Typography variant="caption" color="text.disabled">Upload media files to see analysis results here.</Typography>
          </Paper>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 2 }}>
            {recentUploads.map((item) => {
              const isExpanded = expandedId === item.id;
              return (
                <Paper
                  key={item.id}
                  elevation={0}
                  sx={{
                    borderRadius: '16px',
                    border: `1px solid ${isExpanded ? theme.palette.primary.main : theme.palette.divider}`,
                    overflow: 'hidden',
                    bgcolor: theme.palette.background.paper,
                    transition: 'all 0.2s',
                    gridColumn: isExpanded ? { xs: '1', sm: '1 / -1' } : 'auto',
                    '&:hover': { borderColor: theme.palette.primary.main + '60' },
                  }}
                >
                  {/* Card Header */}
                  <Box
                    onClick={async () => {
                      if (isExpanded) { setExpandedId(null); return; }
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
                            if (typeof metadata === 'string') { try { metadata = JSON.parse(metadata); } catch { /* ignore */ } }
                            if (typeof results === 'string') { try { results = JSON.parse(results); } catch { /* ignore */ } }
                            const mime = metadata?.mimeType || 'image/jpeg';
                            const b64 = metadata?.original_image_base64;
                            if (b64) {
                              const imgSrc = b64.startsWith('data:') ? b64 : `data:${mime};base64,${b64}`;
                              setImageCache(prev => ({ ...prev, [item.id]: { image: imgSrc, parking: metadata?.parking, detections: Array.isArray(results) ? results : [] } }));
                            }
                          }
                        } catch (err) { console.error('Failed to load image:', err); }
                        finally { setLoadingImage(null); }
                      }
                    }}
                    sx={{ p: 2.5, cursor: 'pointer' }}
                  >
                    {/* Top Row: Icon + Type Badge */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{
                        p: 1.25, borderRadius: '12px',
                        bgcolor: item.isVideo
                          ? (theme.palette.mode === 'dark' ? 'rgba(139, 92, 246, 0.1)' : '#ede9fe')
                          : (theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.1)' : '#dbeafe'),
                        color: item.isVideo ? '#8b5cf6' : theme.palette.primary.main,
                        display: 'flex',
                      }}>
                        {item.isVideo ? <FileVideo size={22} /> : <FileImage size={22} />}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Eye size={14} style={{ opacity: 0.4 }} />
                        {isExpanded ? <ChevronUp size={16} style={{ opacity: 0.5 }} /> : <ChevronDown size={16} style={{ opacity: 0.5 }} />}
                      </Box>
                    </Box>

                    {/* Filename */}
                    <Typography variant="subtitle2" fontWeight="800" sx={{ mb: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {String(item.name)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block', mb: 2 }}>
                      {String(item.size)} • {String(item.time)}
                    </Typography>

                    {/* Stats Row */}
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Box sx={{
                        px: 1.25, py: 0.5, borderRadius: '8px', fontSize: '0.7rem', fontWeight: 800,
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.1)' : '#dcfce7',
                        color: theme.palette.success.main,
                        border: `1px solid ${theme.palette.success.main}20`,
                      }}>
                        {String(item.detections)} {item.totalSlots ? 'Occupied' : 'Detected'}
                      </Box>
                      {item.availableSlots !== undefined && (
                        <Box sx={{
                          px: 1.25, py: 0.5, borderRadius: '8px', fontSize: '0.7rem', fontWeight: 800,
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.1)' : '#dbeafe',
                          color: theme.palette.primary.main,
                          border: `1px solid ${theme.palette.primary.main}20`,
                        }}>
                          {String(item.availableSlots)}/{String(item.totalSlots)} Free
                        </Box>
                      )}
                      <Box sx={{
                        px: 1.25, py: 0.5, borderRadius: '8px', fontSize: '0.65rem', fontWeight: 800,
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                        color: theme.palette.text.secondary,
                        textTransform: 'uppercase',
                      }}>
                        {item.isVideo ? 'Video' : 'Image'}
                      </Box>
                    </Box>
                  </Box>

                  {/* Expanded Preview */}
                  {isExpanded && (
                    <Box sx={{ px: 2.5, pb: 2.5, borderTop: `1px solid ${theme.palette.divider}` }}>
                      {loadingImage === item.id ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4, color: theme.palette.text.secondary, gap: 1 }}>
                          <Loader2 size={18} className="animate-spin" />
                          <Typography variant="caption" fontWeight={600}>Loading analysis preview...</Typography>
                        </Box>
                      ) : imageCache[item.id] ? (
                        <ResultImageCanvas data={imageCache[item.id]} />
                      ) : (
                        <Box sx={{ py: 4, textAlign: 'center' }}>
                          <AlertCircle size={24} style={{ color: theme.palette.text.disabled, marginBottom: 8 }} />
                          <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>No image data available.</Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                </Paper>
              );
            })}
          </Box>
        )}
      </Box>

      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </Box>
  );
};

export default MediaUploads;
