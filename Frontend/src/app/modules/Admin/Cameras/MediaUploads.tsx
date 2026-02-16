import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Upload, FileVideo, FileImage, Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../../../utils/services/api';
import { supabase } from '../../../utils/lib/supabase';
import { useTheme } from '@mui/material/styles';
import ProcessingPreview from './ProcessingPreview';
import { IRootState } from '@app/appReducer';
import { 
  SET_FILE_STATUS, 
  MERGE_FILE_STATUSES, 
  CLEAR_STATUSES, 
  SET_HISTORY, 
  ADD_HISTORY_ITEM 
} from './mediaReducer';

const MediaUploads: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  
  // Use global Redux state for persistence across navigation
  const { fileStatuses, recentUploads } = useSelector((state: IRootState) => state.app.media);
  
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [watchingFile, setWatchingFile] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

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

      const formattedHistory = (data || []).map(row => ({
        id: row.id,
        name: row.metadata?.filename || 'Unknown',
        size: row.metadata?.is_video ? `${row.metadata?.frames_processed} Frames` : 'Single Image',
        time: new Date(row.timestamp).toLocaleString(),
        detections: Array.isArray(row.results) ? row.results.length : 0,
        isVideo: row.metadata?.is_video
      }));

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
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
    } finally {
      if (e.target) e.target.value = '';
    }
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
          
          const filename = newDoc.metadata?.filename;
          console.log('[MediaUploads] Processing upload for filename:', filename);
          
          if (filename) {
            // Update status in Redux
            console.log('[MediaUploads] Dispatching SET_FILE_STATUS to "done" for:', filename);
            dispatch({ type: SET_FILE_STATUS, name: filename, status: 'done' });

            // Add to history in Redux
            dispatch({ 
              type: ADD_HISTORY_ITEM, 
              item: { 
                id: newDoc.id,
                name: filename, 
                size: newDoc.metadata?.is_video ? `${newDoc.metadata?.frames_processed} Frames` : 'Single Image', 
                time: new Date(newDoc.timestamp).toLocaleString(), 
                detections: Array.isArray(newDoc.results) ? newDoc.results.length : 0,
                isVideo: newDoc.metadata?.is_video
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
      {watchingFile && (
        <ProcessingPreview 
          filename={watchingFile} 
          onClose={() => setWatchingFile(null)}
          status={fileStatuses[watchingFile]}
        />
      )}
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>Batch Media Hub</h1>
        <p style={{ color: theme.palette.text.secondary }}>Upload multiple files for individual background ML analysis. Progress persists if you leave the page.</p>
      </header>

      <div style={{
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
        border: `2px dashed ${theme.palette.divider}`,
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
              const mime = name.split('.').pop()?.toLowerCase() || '';
              const isImg = ['jpg', 'jpeg', 'png', 'webp'].includes(mime);
              
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
                {status === 'processing' && (
                  <button 
                    onClick={() => setWatchingFile(name)}
                    style={{
                      marginLeft: '0.5rem',
                      padding: '0.2rem 0.5rem',
                      backgroundColor: theme.palette.primary.main,
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {isImg ? 'VIEW' : 'WATCH LIVE'}
                  </button>
                )}
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
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', backgroundColor: theme.palette.background.paper, borderRadius: '12px', border: `1px solid ${theme.palette.divider}`, transition: 'transform 0.2s' }}>
                <div style={{ padding: '0.5rem', backgroundColor: theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.1)' : '#e0e7ff', color: theme.palette.primary.main, borderRadius: '8px' }}>
                  {!item.isVideo ? <FileImage size={20} /> : <FileVideo size={20} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: theme.palette.text.primary }}>{item.name}</div>
                  <div style={{ fontSize: '0.75rem', color: theme.palette.text.secondary }}>{item.size} • {item.time}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', backgroundColor: theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.1)' : '#dcfce7', color: theme.palette.success.main, borderRadius: '4px', fontWeight: 700 }}>
                    {item.detections} Uniques Detected
                  </span>
                </div>
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
