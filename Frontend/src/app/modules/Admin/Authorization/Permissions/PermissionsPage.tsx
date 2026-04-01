import React, { useEffect, useState, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  Fade,
  useMediaQuery,
  CircularProgress,
  Stack,
  IconButton,
  List,
  ListItem
} from '@mui/material';
import { 
  Plus, 
  Search, 
  ChevronDown, 
  ShieldAlert, 
  Users, 
  Settings, 
  Activity, 
  Video, 
  Car,
  FolderLock,
  X
} from 'lucide-react';
import { api } from '@utils/services/api';
import { toast } from 'react-toastify';
import ErrorBoundary from '@shared/components/ErrorBoundary';

interface Permission {
  id: string;
  name: string;
  module: string;
  description: string;
  scope: string;
}

const PermissionsPage: React.FC = () => {
  return (
    <ErrorBoundary>
      <PermissionsPageContent />
    </ErrorBoundary>
  );
};

const PermissionsPageContent: React.FC = () => {
  const theme = useTheme();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // UX Breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isExtraSmall = useMediaQuery('(max-width:400px)');

  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', module: '', description: '', scope: 'global' });
  const [expandedAccordions, setExpandedAccordions] = useState<string[]>([]);

  // Adaptive Sizing (De-bulked)
  const controlHeight = isMobile ? '38px' : '44px';
  const controlFontSize = isMobile ? '0.8rem' : '0.9rem';
  const containerPadding = isExtraSmall ? 2 : isMobile ? 3 : 5;

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      let data = await api.fetchPermissions();

      // --- Auto Seed Fines Permissions ---
      const requiredFines = [
        { name: 'fines.view.own', module: 'Fines', description: 'View own fines', scope: 'system' },
        { name: 'fines.pay.own', module: 'Fines', description: 'Pay own fines', scope: 'system' },
        { name: 'fines.view.all', module: 'Fines', description: 'View all fines in the system', scope: 'global' },
        { name: 'fines.manage.all', module: 'Fines', description: 'Manage all fines', scope: 'global' }
      ];
      
      let needsRefetch = false;
      const existingNames = data.map((p: Permission) => p.name);
      
      for (const perm of requiredFines) {
        if (!existingNames.includes(perm.name)) {
          try {
            await api.createPermission(perm);
            needsRefetch = true;
          } catch (err) {
            console.warn('Auto-seed failed for', perm.name, err);
          }
        }
      }

      if (needsRefetch) {
        data = await api.fetchPermissions();
      }
      // --- End Auto Seed ---

      setPermissions(data);
      const modules = Array.from(new Set(data.map((p: Permission) => p.module)));
      setExpandedAccordions(modules as string[]);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast.error('Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const handleOpenModal = () => {
    setFormData({ name: '', module: '', description: '', scope: 'global' });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleSubmit = async () => {
    try {
      await api.createPermission(formData);
      toast.success('Permission created successfully');
      fetchPermissions();
      handleCloseModal();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err.message || 'Operation failed');
    }
  };

  const toggleAccordion = (mod: string) => {
    setExpandedAccordions(prev => 
      prev.includes(mod) ? prev.filter(m => m !== mod) : [...prev, mod]
    );
  };

  const groupedPermissions = useMemo(() => {
    const filtered = permissions.filter(perm => 
      perm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      perm.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
      perm.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const groups: Record<string, Permission[]> = {};
    filtered.forEach(perm => {
      if (!groups[perm.module]) {
        groups[perm.module] = [];
      }
      groups[perm.module].push(perm);
    });

    return groups;
  }, [permissions, searchTerm]);

  const getModuleIcon = (moduleName: string) => {
    const name = moduleName.toLowerCase();
    if (name.includes('user') || name.includes('auth')) return <Users size={18} />;
    if (name.includes('camera') || name.includes('stream')) return <Video size={18} />;
    if (name.includes('park') || name.includes('vehicle')) return <Car size={18} />;
    if (name.includes('activ') || name.includes('log')) return <Activity size={18} />;
    if (name.includes('system') || name.includes('setting')) return <Settings size={18} />;
    return <FolderLock size={18} />;
  };

  const getModuleColor = (moduleName: string) => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    let hash = 0;
    for (let i = 0; i < moduleName.length; i++) {
        hash = moduleName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <Box p={containerPadding} display="flex" flexDirection="column" gap={isMobile ? 3 : 5}>
      
      {/* Search and Action Header */}
      <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} justifyContent="space-between" alignItems={isMobile ? 'flex-start' : 'center'} gap={4}>
        <Box>
          <Typography fontWeight="900" sx={{ fontSize: isExtraSmall ? '1.75rem' : isMobile ? '2.25rem' : '3.25rem', letterSpacing: '-0.03em', lineHeight: 1.1, color: theme.palette.text.primary, mb: 1 }}>
            Permissions
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, opacity: 0.9 }}>
            Manage access levels and permissions across all modules
          </Typography>
        </Box>
        
        <Stack direction={isMobile ? 'column' : 'row'} spacing={2} width={isMobile ? '100%' : 'auto'} alignItems="center">
          <Paper 
              elevation={0} 
              sx={{ 
                px: 2, borderRadius: '12px', flex: isMobile ? 'none' : 1,
                width: isMobile ? '100%' : '300px',
                border: `1px solid ${theme.palette.divider}`,
                background: theme.palette.background.paper,
                display: 'flex', alignItems: 'center', height: controlHeight
              }}
          >
              <Search size={18} color={theme.palette.text.secondary} />
              <TextField 
                variant="standard" placeholder="Search permissions..." fullWidth sx={{ ml: 1.5 }}
                InputProps={{ disableUnderline: true, style: { fontSize: controlFontSize, fontWeight: 600 } }}
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              />
          </Paper>

          <Button 
            variant="contained" 
            size="medium"
            onClick={handleOpenModal}
            startIcon={<Plus size={18} />}
            sx={{ borderRadius: '12px', fontWeight: 900, height: controlHeight, px: 3, textTransform: 'none', width: isMobile ? '100%' : 'auto' }}
          >
            Add Permission
          </Button>
        </Stack>
      </Box>

      {/* Permissions Content */}
      <Box flex={1} display="flex" flexDirection="column" gap={2}>
        {loading ? (
             <Box display="flex" justifyContent="center" py={12}><CircularProgress thickness={5} size={70} /></Box>
        ) : Object.keys(groupedPermissions).length === 0 ? (
          <Box textAlign="center" py={15} sx={{ opacity: 0.3 }}>
            <FolderLock size={100} strokeWidth={1} style={{ marginBottom: 20 }} />
            <Typography variant="h5" fontWeight="800">No Permissions Found</Typography>
          </Box>
        ) : (
          Object.keys(groupedPermissions).sort().map(moduleName => {
            const modColor = getModuleColor(moduleName);
            const isExpanded = expandedAccordions.includes(moduleName);
            
            return (
              <Fade in={true} key={moduleName}>
                <Accordion 
                  expanded={isExpanded}
                  onChange={() => toggleAccordion(moduleName)}
                  disableGutters
                  elevation={0}
                  sx={{
                    background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#ffffff',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: '16px !important',
                    overflow: 'hidden',
                    '&:before': { display: 'none' },
                    boxShadow: isExpanded ? `0 4px 20px rgba(0,0,0,0.03)` : 'none'
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ChevronDown size={18} color={theme.palette.text.secondary} />}
                    sx={{
                      px: isMobile ? 2 : 3,
                      py: 0.5,
                      background: isExpanded ? 'rgba(0,0,0,0.01)' : 'transparent',
                      borderBottom: isExpanded ? `1px solid ${theme.palette.divider}` : 'none'
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={2}>
                      <Box sx={{ p: 1, borderRadius: '10px', background: `${modColor}10`, color: modColor, display: 'flex' }}>
                        {getModuleIcon(moduleName)}
                      </Box>
                      <Box>
                        <Typography variant="body1" fontWeight="900" sx={{ textTransform: 'capitalize' }}>
                          {moduleName} Module
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight="800" sx={{ fontSize: '0.65rem' }}>
                          {groupedPermissions[moduleName].length} PERMISSIONS
                        </Typography>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  
                  <AccordionDetails sx={{ p: 0 }}>
                    <List disablePadding>
                      {groupedPermissions[moduleName].map((perm, index) => (
                        <ListItem 
                          key={perm.id}
                          sx={{
                            px: isMobile ? 2.5 : 4,
                            py: 2,
                            borderBottom: index < groupedPermissions[moduleName].length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 2,
                            '&:hover': { background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }
                          }}
                        >
                           <Box mt={0.5} sx={{ color: theme.palette.text.disabled, display: 'flex' }}>
                             <ShieldAlert size={16} />
                           </Box>
                           <Box flex={1}>
                             <Box display="flex" alignItems="center" gap={1.5} mb={0.25} flexWrap="wrap">
                               <Typography variant="caption" fontWeight="900" sx={{ fontFamily: 'monospace', letterSpacing: '-0.2px', fontSize: '0.8rem' }}>
                                 {perm.name}
                               </Typography>
                               <Chip 
                                 label={perm.scope}
                                 size="small"
                                 sx={{
                                   height: '18px',
                                   fontSize: '0.55rem',
                                   fontWeight: 800,
                                   textTransform: 'uppercase',
                                   background: perm.scope === 'global' ? `${theme.palette.error.main}10` : `${theme.palette.success.main}10`,
                                   color: perm.scope === 'global' ? theme.palette.error.main : theme.palette.success.main
                                 }}
                               />
                             </Box>
                             <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5, fontWeight: 500, fontSize: '0.75rem' }}>
                               {perm.description || 'No detailed description provided.'}
                             </Typography>
                           </Box>
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              </Fade>
            );
          })
        )}
      </Box>

      {/* Refined Create Permission Dialog (De-bulked) */}
      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="xs" fullWidth TransitionComponent={Fade} PaperProps={{ sx: { borderRadius: '24px' } }}>
        <DialogTitle sx={{ fontWeight: 900, p: 0 }}>
           <Box sx={{ p: isMobile ? 2.5 : 3, bgcolor: `${theme.palette.info.main}08`, color: theme.palette.info.main, borderRadius: '24px 24px 0 0', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1, borderRadius: '10px', bgcolor: 'white', display: 'flex', boxShadow: theme.shadows[2] }}><ShieldAlert size={18} /></Box>
              <Box>
                <Typography variant="body1" fontWeight="900">Add Permission</Typography>
                <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 700, fontSize: '0.65rem' }}>Register new access rule</Typography>
              </Box>
              <IconButton size="small" onClick={handleCloseModal} sx={{ ml: 'auto', bgcolor: theme.palette.mode==='dark'?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.05)', color: 'inherit' }}><X size={16} /></IconButton>
           </Box>
        </DialogTitle>
        <DialogContent sx={{ p: isMobile ? 2.5 : 3.5, pt: isMobile ? 3 : 4 }}>
          <Stack spacing={3}>
            <Box>
               <Typography variant="caption" fontWeight="800" color="text.secondary" sx={{ ml: 1.5, mb: 0.75, display: 'block', textTransform: 'uppercase', fontSize: '0.65rem' }}>Permission Name</Typography>
               <TextField variant="filled" fullWidth placeholder="e.g. users.create" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} InputProps={{ disableUnderline: true, sx: { borderRadius: '14px', fontWeight: 700, height: 44, fontSize: '0.85rem' } }} />
            </Box>
            <Stack direction="row" spacing={2}>
              <Box flex={1}>
                <Typography variant="caption" fontWeight="800" color="text.secondary" sx={{ ml: 1.5, mb: 0.75, display: 'block', textTransform: 'uppercase', fontSize: '0.65rem' }}>Module</Typography>
                <TextField variant="filled" fullWidth value={formData.module} onChange={(e) => setFormData({ ...formData, module: e.target.value })} InputProps={{ disableUnderline: true, sx: { borderRadius: '14px', fontWeight: 700, height: 44, fontSize: '0.85rem' } }} />
              </Box>
              <Box flex={1}>
                <Typography variant="caption" fontWeight="800" color="text.secondary" sx={{ ml: 1.5, mb: 0.75, display: 'block', textTransform: 'uppercase', fontSize: '0.65rem' }}>Scope</Typography>
                <TextField variant="filled" fullWidth value={formData.scope} onChange={(e) => setFormData({ ...formData, scope: e.target.value })} InputProps={{ disableUnderline: true, sx: { borderRadius: '14px', fontWeight: 700, height: 44, fontSize: '0.85rem' } }} />
              </Box>
            </Stack>
            <Box>
               <Typography variant="caption" fontWeight="800" color="text.secondary" sx={{ ml: 1.5, mb: 0.75, display: 'block', textTransform: 'uppercase', fontSize: '0.65rem' }}>Description</Typography>
               <TextField variant="filled" fullWidth multiline rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} InputProps={{ disableUnderline: true, sx: { borderRadius: '14px', fontWeight: 700, fontSize: '0.85rem', p: 1.5 } }} />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: isMobile ? 2.5 : 3.5, pt: 0 }}>
          <Button variant="contained" color="info" onClick={handleSubmit} disabled={!formData.name || !formData.module} fullWidth size="large" sx={{ borderRadius: '14px', py: 1.5, fontWeight: 900, textTransform: 'none', boxShadow: 3 }}>Create Permission</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PermissionsPage;
