import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  IconButton, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  useTheme,
  Fade,
  Stack,
  useMediaQuery,
  CircularProgress,
  Grid,
  Divider,
  Chip
} from '@mui/material';
import { 
  Car, 
  Trash2, 
  Plus, 
  CheckCircle2,
  Info,
  X,
  Edit2,
  ChevronRight
} from 'lucide-react';
import { api } from '@utils/services/api';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from '@app/appReducer';
import { toast } from 'react-toastify';
import ErrorBoundary from '@shared/components/ErrorBoundary';

const VehiclesPage: React.FC = () => {
  return (
    <ErrorBoundary>
      <VehiclesPageContent />
    </ErrorBoundary>
  );
};

const VehiclesPageContent: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { user } = useSelector((state: IRootState) => state.app.auth);
  
  const [loading, setLoading] = useState(true);
  const [vehicle, setVehicle] = useState<any>(null);
  
  // UX Breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isExtraSmall = useMediaQuery('(max-width:400px)');
  const isTinyMobile = useMediaQuery('(max-width:340px)');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ number: '', type: 'Four-wheeler', make_model: '', color: '' });
  const [error, setError] = useState<string | null>(null);

  // Adaptive Sizing (De-bulked)
  const controlHeight = isMobile ? '40px' : '48px';
  const containerPadding = isTinyMobile ? 2 : isExtraSmall ? 2.5 : isMobile ? 3 : 5;

  const loadVehicle = async () => {
    try {
      setLoading(true);
      const data = await api.fetchVehicle();
      if (data && data.vehicle_number) {
        setVehicle(data);
      } else {
        setVehicle(null);
      }
    } catch (err) {
      console.error('Failed to load vehicle', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicle();
  }, []);

  const handleAddVehicle = async () => {
    if (!newVehicle.number.trim()) {
      setError('License plate is required');
      return;
    }

    try {
      await api.registerVehicle({
        number: newVehicle.number,
        type: newVehicle.type,
        make_model: newVehicle.make_model,
        color: newVehicle.color
      });
      
      await loadVehicle();
      
      if (user) {
        dispatch({
          type: 'AUTH/RECEIVE_USER_DATA',
          data: {
            ...user,
            vehicle_number: newVehicle.number,
            vehicle_type: newVehicle.type,
            vehicle_make_model: newVehicle.make_model,
            vehicle_color: newVehicle.color
          }
        });
      }

      setShowAddModal(false);
      setNewVehicle({ number: '', type: 'Four-wheeler', make_model: '', color: '' });
      setError(null);
      toast.success(vehicle ? 'Vehicle details updated' : 'Vehicle added successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to register vehicle');
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await api.deleteVehicle();
      setVehicle(null);
      if (user) {
        dispatch({
          type: 'AUTH/RECEIVE_USER_DATA',
          data: {
            ...user,
            vehicle_number: undefined,
            vehicle_type: undefined,
            vehicle_make_model: undefined,
            vehicle_color: undefined
          }
        });
      }
      setShowDeleteModal(false);
      toast.info('Vehicle record removed');
    } catch (err) {
      toast.error('Failed to remove vehicle');
    }
  };

  const handleEditClick = () => {
    setNewVehicle({
      number: vehicle.vehicle_number || '',
      type: vehicle.vehicle_type || 'Four-wheeler',
      make_model: vehicle.vehicle_make_model || '',
      color: vehicle.vehicle_color || ''
    });
    setShowAddModal(true);
  };

  return (
    <Box p={containerPadding} display="flex" flexDirection="column" gap={isMobile ? 3 : 5}>
      
      {/* Search and Action Header */}
      <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} justifyContent="space-between" alignItems={isMobile ? 'flex-start' : 'center'} gap={4}>
        <Box>
          <Typography fontWeight="900" sx={{ fontSize: isExtraSmall ? '1.75rem' : isMobile ? '2.25rem' : '3.25rem', letterSpacing: '-0.03em', lineHeight: 1.1, color: theme.palette.text.primary, mb: 1 }}>
            My Vehicles
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, opacity: 0.9 }}>
            Register and manage your transportation for campus permits
          </Typography>
        </Box>
        
        {!vehicle && !loading && (
          <Button 
            variant="contained" 
            size="medium"
            onClick={() => setShowAddModal(true)}
            startIcon={<Plus size={18} />}
            sx={{ borderRadius: '12px', fontWeight: 900, height: controlHeight, px: 3, textTransform: 'none', width: isMobile ? '100%' : 'auto' }}
          >
            Add Vehicle
          </Button>
        )}
      </Box>

      {/* Main Content Area */}
      <Box flex={1}>
        {loading ? (
             <Box display="flex" justifyContent="center" py={12}><CircularProgress thickness={5} size={70} /></Box>
        ) : !vehicle ? (
          <Fade in={true}>
            <Paper 
                elevation={0}
                sx={{ 
                  p: isMobile ? 4 : 8, borderRadius: '24px', textAlign: 'center', 
                  border: `2px dashed ${theme.palette.divider}`,
                  bgcolor: theme.palette.background.paper,
                  display: 'flex', flexDirection: 'column', alignItems: 'center'
                }}
            >
              <Box sx={{ p: 2.5, borderRadius: '20px', bgcolor: `${theme.palette.primary.main}10`, color: theme.palette.primary.main, mb: 3 }}>
                <Car size={isMobile ? 32 : 48} />
              </Box>
              <Typography variant={isMobile ? "h6" : "h5"} fontWeight="900" sx={{ mb: 1.5 }}>No Registered Vehicles</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: '400px', mb: 4, fontWeight: 500, lineHeight: 1.6 }}>
                You haven't registered a vehicle yet. Add your vehicle details here to start applying for campus parking permits.
              </Typography>
              <Button 
                  variant="contained" 
                  size="large" 
                  onClick={() => setShowAddModal(true)}
                  sx={{ borderRadius: '14px', px: 5, py: 1.5, fontWeight: 900 }}
              >
                Get Started
              </Button>
            </Paper>
          </Fade>
        ) : (
          <Grid container spacing={isMobile ? 2 : 3}>
            {/* Primary Vehicle Card */}
            <Grid size={{ xs: 12, md: 7, lg: 8 }}>
              <Fade in={true}>
                <Paper 
                  elevation={0}
                  sx={{ 
                     p: isMobile ? 3 : 4, borderRadius: '24px', border: `2px solid ${theme.palette.divider}`,
                     bgcolor: theme.palette.background.paper, position: 'relative', overflow: 'hidden'
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
                     <Stack direction="row" spacing={2} alignItems="center">
                        <Box sx={{ p: 1.5, borderRadius: '14px', bgcolor: `${theme.palette.primary.main}10`, color: theme.palette.primary.main }}>
                           <Car size={24} />
                        </Box>
                        <Box>
                           <Typography variant="caption" color="text.secondary" fontWeight="800" sx={{ textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.05em' }}>Current Vehicle</Typography>
                           <Typography variant="body1" fontWeight="900" sx={{ lineHeight: 1 }}>{vehicle.vehicle_type}</Typography>
                        </Box>
                     </Stack>
                     <Chip label="PRIMARY" size="small" icon={<CheckCircle2 size={12} />} sx={{ fontWeight: 900, borderRadius: '6px', fontSize: '0.65rem', color: theme.palette.success.main, bgcolor: `${theme.palette.success.main}10` }} />
                  </Box>

                  <Box py={2}>
                     <Typography variant="caption" color="text.secondary" fontWeight="800" sx={{ textTransform: 'uppercase', fontSize: '0.65rem', display: 'block', mb: 0.5 }}>License Plate</Typography>
                     <Typography variant={isMobile ? "h4" : "h2"} fontWeight="900" sx={{ letterSpacing: '0.1em', fontFamily: 'monospace', mb: 2 }}>{vehicle.vehicle_number}</Typography>
                     
                     <Stack direction={isMobile ? "column" : "row"} spacing={isMobile ? 2 : 4} divider={<Divider orientation={isMobile ? "horizontal" : "vertical"} flexItem sx={{ opacity: 0.5 }} />}>
                        <Box>
                           <Typography variant="caption" color="text.secondary" fontWeight="800" sx={{ textTransform: 'uppercase', fontSize: '0.65rem', display: 'block', mb: 0.5 }}>Vehicle Details</Typography>
                           <Typography variant="body2" fontWeight="800">{vehicle.vehicle_make_model || 'Not provided'}</Typography>
                        </Box>
                        <Box>
                           <Typography variant="caption" color="text.secondary" fontWeight="800" sx={{ textTransform: 'uppercase', fontSize: '0.65rem', display: 'block', mb: 0.5 }}>Color Theme</Typography>
                           <Typography variant="body2" fontWeight="800">{vehicle.vehicle_color || 'Not provided'}</Typography>
                        </Box>
                     </Stack>
                  </Box>

                  <Divider sx={{ my: 3, opacity: 0.5 }} />

                  <Box display="flex" justifyContent="space-between" alignItems="center">
                     <Button 
                        startIcon={<Edit2 size={16} />} 
                        onClick={handleEditClick}
                        sx={{ fontWeight: 800, color: theme.palette.text.secondary, textTransform: 'none', '&:hover': { color: theme.palette.primary.main } }}
                     >
                        Update Details
                     </Button>
                     <IconButton color="error" onClick={() => setShowDeleteModal(true)} sx={{ borderRadius: '12px', bgcolor: `${theme.palette.error.main}08` }}>
                        <Trash2 size={18} />
                     </IconButton>
                  </Box>
                </Paper>
              </Fade>
            </Grid>

            {/* Quick Tips / Support Card */}
            <Grid size={{ xs: 12, md: 5, lg: 4 }}>
               <Paper 
                  elevation={0}
                  sx={{ 
                     p: 3, borderRadius: '24px', height: '100%',
                     background: theme.palette.mode === 'dark' ? `linear-gradient(135deg, ${theme.palette.background.paper} 0%, #1e1e2d 100%)` : theme.palette.primary.main,
                     color: 'white', display: 'flex', flexDirection: 'column'
                  }}
               >
                  <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                     <Box sx={{ p: 1, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.1)' }}>
                        <Info size={18} />
                     </Box>
                     <Typography variant="body1" fontWeight="900">Security Note</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, lineHeight: 1.6, fontWeight: 500, flex: 1, mb: 3 }}>
                    You can only have one primary vehicle registered for an active parking permit system-wide. 
                    If you switch vehicles, ensure you update your **License Plate** immediately to avoid parking violations.
                  </Typography>
                  <Button 
                    fullWidth variant="contained" 
                    sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px', fontWeight: 900, textTransform: 'none', py: 1.25, '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
                    endIcon={<ChevronRight size={16} />}
                  >
                    View Guidelines
                  </Button>
               </Paper>
            </Grid>
          </Grid>
        )}
      </Box>

      {/* Add/Edit Vehicle Dialog (De-bulked) */}
      <Dialog open={showAddModal} onClose={() => setShowAddModal(false)} maxWidth="xs" fullWidth TransitionComponent={Fade} PaperProps={{ sx: { borderRadius: '24px' } }}>
        <DialogTitle sx={{ fontWeight: 900, p: 0 }}>
           <Box sx={{ p: isMobile ? 2.5 : 3, bgcolor: `${theme.palette.primary.main}08`, color: theme.palette.primary.main, borderRadius: '24px 24px 0 0', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1, borderRadius: '10px', bgcolor: theme.palette.background.paper, display: 'flex', boxShadow: theme.shadows[2] }}><Car size={18} /></Box>
              <Box>
                <Typography variant="body1" fontWeight="900">{vehicle ? 'Edit Vehicle' : 'Add Vehicle'}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 700, fontSize: '0.65rem' }}>Update registration details</Typography>
              </Box>
              <IconButton size="small" onClick={() => setShowAddModal(false)} sx={{ ml: 'auto', bgcolor: theme.palette.mode==='dark'?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.05)', color: 'inherit' }}><X size={16} /></IconButton>
           </Box>
        </DialogTitle>
        <DialogContent sx={{ p: isMobile ? 2.5 : 3.5, pt: isMobile ? 3 : 4 }}>
          <Stack spacing={2.5}>
            <Box>
               <Typography variant="caption" fontWeight="800" color="text.secondary" sx={{ ml: 1.5, mb: 0.75, display: 'block', textTransform: 'uppercase', fontSize: '0.65rem' }}>License Plate</Typography>
               <TextField variant="filled" fullWidth placeholder="ABC-1234" value={newVehicle.number} onChange={(e) => setNewVehicle({ ...newVehicle, number: e.target.value })} error={!!error} helperText={error} InputProps={{ disableUnderline: true, sx: { borderRadius: '14px', fontWeight: 700, height: 48, fontSize: '0.9rem' } }} />
            </Box>
            <Box>
               <Typography variant="caption" fontWeight="800" color="text.secondary" sx={{ ml: 1.5, mb: 0.75, display: 'block', textTransform: 'uppercase', fontSize: '0.65rem' }}>Category</Typography>
               <TextField select variant="filled" fullWidth value={newVehicle.type} onChange={(e) => setNewVehicle({ ...newVehicle, type: e.target.value })} InputProps={{ disableUnderline: true, sx: { borderRadius: '14px', fontWeight: 700, height: 48, fontSize: '0.9rem' } }}>
                  <MenuItem value="Four-wheeler">Four-wheeler (Car/SUV)</MenuItem>
                  <MenuItem value="Two-wheeler">Two-wheeler (Bike/Scooter)</MenuItem>
                  <MenuItem value="Electric">Electric Vehicle</MenuItem>
                  <MenuItem value="Bicycle">Bicycle</MenuItem>
               </TextField>
            </Box>
            <Box>
               <Typography variant="caption" fontWeight="800" color="text.secondary" sx={{ ml: 1.5, mb: 0.75, display: 'block', textTransform: 'uppercase', fontSize: '0.65rem' }}>Vehicle Details</Typography>
               <TextField variant="filled" fullWidth placeholder="e.g. Tesla Model 3" value={newVehicle.make_model} onChange={(e) => setNewVehicle({ ...newVehicle, make_model: e.target.value })} InputProps={{ disableUnderline: true, sx: { borderRadius: '14px', fontWeight: 700, height: 48, fontSize: '0.9rem' } }} />
            </Box>
            <Box>
               <Typography variant="caption" fontWeight="800" color="text.secondary" sx={{ ml: 1.5, mb: 0.75, display: 'block', textTransform: 'uppercase', fontSize: '0.65rem' }}>Color Theme</Typography>
               <TextField variant="filled" fullWidth placeholder="e.g. Silver" value={newVehicle.color} onChange={(e) => setNewVehicle({ ...newVehicle, color: e.target.value })} InputProps={{ disableUnderline: true, sx: { borderRadius: '14px', fontWeight: 700, height: 48, fontSize: '0.9rem' } }} />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: isMobile ? 2.5 : 3.5, pt: 0 }}>
          <Button variant="contained" color="primary" onClick={handleAddVehicle} fullWidth size="large" sx={{ borderRadius: '14px', py: 1.5, fontWeight: 900, textTransform: 'none', boxShadow: 3 }}>{vehicle ? 'Save Updates' : 'Add Vehicle'}</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Modal (De-bulked) */}
      <Dialog open={showDeleteModal} onClose={() => setShowDeleteModal(false)} TransitionComponent={Fade} PaperProps={{ sx: { borderRadius: '24px', p: 0.5, maxWidth: '380px', textAlign: 'center' } }}>
        <DialogContent sx={{ pt: isMobile ? 4 : 5, pb: 3 }}>
          <Box display="flex" justifyContent="center" mb={3}>
            <Box sx={{ p: 2, borderRadius: '50%', background: `${theme.palette.error.main}10`, color: theme.palette.error.main, animation: 'pulse 2s infinite ease-in-out' }}>
              <Trash2 size={32} />
            </Box>
          </Box>
          <Typography variant="h6" fontWeight="900" sx={{ mb: 1.5 }}>Remove Vehicle?</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, px: 2, display: 'block', lineHeight: 1.5 }}>
            Are you sure you want to remove vehicle **{vehicle?.vehicle_number}**? This action cannot be reversed.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 4, px: 3, gap: 1.5 }}>
          <Button onClick={() => setShowDeleteModal(false)} fullWidth variant="outlined" color="inherit" size="medium" sx={{ borderRadius: '12px', fontWeight: 800, borderWidth: 2 }}>Cancel</Button>
          <Button onClick={handleConfirmDelete} fullWidth variant="contained" color="error" size="medium" sx={{ borderRadius: '12px', fontWeight: 900, boxShadow: 4 }}>Remove</Button>
        </DialogActions>
        <style>{`
          @keyframes pulse {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
            70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
          }
        `}</style>
      </Dialog>

    </Box>
  );
};

export default VehiclesPage;
