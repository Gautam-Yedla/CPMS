import React, { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, Typography, Button, CircularProgress, Paper, Divider, Stack } from '@mui/material';
import { Sparkles, MapPin, Navigation, Info } from 'lucide-react';
import { api } from '@services/api';

const RecommendationCard: React.FC = () => {
  const theme = useTheme();
  const [recommendation, setRecommendation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getRecommendation = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.fetchBestSlotRecommendation();
      setRecommendation(data);
    } catch (err: any) {
      console.error('Failed to get recommendation:', err);
      setError(err.message || 'Failed to generate recommendation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 3, 
        bgcolor: 'background.paper', 
        borderRadius: '24px', 
        border: `1px solid ${theme.palette.divider}`,
        position: 'relative',
        overflow: 'hidden',
        minHeight: '220px',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Decorative background flare */}
      <Box sx={{ 
        position: 'absolute', 
        top: -20, 
        right: -20, 
        width: 100, 
        height: 100, 
        bgcolor: 'primary.main', 
        opacity: 0.05, 
        borderRadius: '50%',
        filter: 'blur(40px)'
      }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ p: 1, borderRadius: '12px', bgcolor: 'primary.light', display: 'flex' }}>
            <Sparkles size={18} color={theme.palette.primary.main} />
          </Box>
          <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>
            Smart Suggester
          </Typography>
        </Stack>
      </Box>

      {!recommendation && !loading && (
        <Box sx={{ textAlign: 'center', py: 2, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Let AI find the optimal parking spot for you based on current congestion.
          </Typography>
          <Button 
            variant="contained" 
            onClick={getRecommendation}
            startIcon={<Navigation size={16} />}
            sx={{ 
              borderRadius: '12px', 
              textTransform: 'none', 
              fontWeight: 700,
              boxShadow: theme.shadows[4]
            }}
          >
            Find Best Slot
          </Button>
        </Box>
      )}

      {loading && (
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress size={32} thickness={5} />
          <Typography variant="caption" sx={{ mt: 2, fontWeight: 600 }} color="primary">
            Analyzing parking layout...
          </Typography>
        </Box>
      )}

      {error && (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Typography variant="body2" color="error">{error}</Typography>
          <Button size="small" onClick={getRecommendation} sx={{ mt: 1 }}>Retry</Button>
        </Box>
      )}

      {recommendation && !loading && (
        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box sx={{ 
              px: 2, py: 1, 
              borderRadius: '16px', 
              bgcolor: 'success.light', 
              color: 'success.dark',
              fontWeight: 800,
              fontSize: '1.25rem'
            }}>
              Slot {recommendation.recommended.id}
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight={700}>
                {recommendation.recommended.zone} • {recommendation.recommended.camera}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Optimal choice across all connections
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 1.5, borderStyle: 'dashed' }} />

          {recommendation.recommended.reasons && (
            <Box sx={{ mb: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', p: 1.5, borderRadius: '12px' }}>
              <Typography variant="overline" sx={{ fontWeight: 800, mb: 0.5, display: 'block', lineHeight: 1, color: 'text.secondary' }}>
                AI Decision Reasoning
              </Typography>
              <Stack spacing={0.5}>
                {recommendation.recommended.reasons.map((reason: string, idx: number) => (
                  <Stack key={idx} direction="row" spacing={1} alignItems="flex-start">
                    <Sparkles size={12} color={theme.palette.primary.main} style={{ marginTop: '2px' }} />
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary', lineHeight: 1.2 }}>
                      {reason}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          )}

          <Stack direction="row" spacing={1} alignItems="center">
            <Info size={14} color={theme.palette.text.secondary} />
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              Path: {recommendation.recommended.path.join(' → ')}
            </Typography>
          </Stack>

          <Button 
            fullWidth 
            size="small" 
            variant="outlined" 
            onClick={() => setRecommendation(null)}
            sx={{ mt: 2, borderRadius: '10px', textTransform: 'none' }}
          >
            Clear Search
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default RecommendationCard;
