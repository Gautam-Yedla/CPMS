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
  List,
  ListItem,
  InputAdornment
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
  FolderLock
} from 'lucide-react';
import { api } from '@utils/services/api';
import { toast } from 'react-toastify';

interface Permission {
  id: string;
  name: string;
  module: string;
  description: string;
  scope: string;
}

const PermissionsPage: React.FC = () => {
  const theme = useTheme();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', module: '', description: '', scope: 'global' });
  const [expandedAccordions, setExpandedAccordions] = useState<string[]>([]);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const data = await api.fetchPermissions();
      setPermissions(data);
      // Auto-expand all by default initially
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
    } catch (error: any) {
      toast.error(error.message || 'Operation failed');
    }
  };

  const toggleAccordion = (mod: string) => {
    setExpandedAccordions(prev => 
      prev.includes(mod) ? prev.filter(m => m !== mod) : [...prev, mod]
    );
  };

  // Memoize grouped & filtered permissions
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

  // Helper to get an icon based on module name
  const getModuleIcon = (moduleName: string) => {
    const name = moduleName.toLowerCase();
    if (name.includes('user') || name.includes('auth')) return <Users size={20} />;
    if (name.includes('camera') || name.includes('stream')) return <Video size={20} />;
    if (name.includes('park') || name.includes('vehicle')) return <Car size={20} />;
    if (name.includes('activ') || name.includes('log')) return <Activity size={20} />;
    if (name.includes('system') || name.includes('setting')) return <Settings size={20} />;
    return <FolderLock size={20} />;
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
    <Box p={2}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <div>
           <Typography fontWeight="700" sx={{ fontSize: '1.875rem', color: theme.palette.text.primary, mb: 0.5 }}>
            System Capabilities
          </Typography>
          <Typography variant="body1" color="text.secondary">Define explicit granular capabilities across all logical modules.</Typography>
        </div>
        <Box display="flex" gap={2} alignItems="center">
          <Paper 
            elevation={0} 
            sx={{ 
              px: 2, 
              py: 0.75, 
              borderRadius: '12px',
              border: `1px solid ${theme.palette.divider}`,
              background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0,0,0,0.01)',
              backdropFilter: 'blur(10px)',
              width: '320px'
            }}
          >
            <TextField 
              variant="standard" 
              placeholder="Search capabilities by name or description..." 
              fullWidth 
              InputProps={{ 
                disableUnderline: true, 
                style: { fontSize: '0.95rem' },
                startAdornment: <InputAdornment position="start"><Search size={18} color={theme.palette.text.secondary} /></InputAdornment>
              }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Paper>
          <Button 
            variant="contained" 
            size="large"
            color="info"
            startIcon={<Plus size={20} />}
            onClick={handleOpenModal}
            sx={{ borderRadius: '12px', boxShadow: `0 8px 16px ${theme.palette.info.main}40`, px: 3, height: '42px' }}
          >
            New Capability
          </Button>
        </Box>
      </Box>

      <Box display="flex" flexDirection="column" gap={3}>
        {Object.keys(groupedPermissions).sort().map(moduleName => {
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
                  '&:before': { display: 'none' }, // Remove default accordion top border
                  boxShadow: isExpanded 
                    ? `0 8px 32px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.05)'}` 
                    : 'none',
                  transition: 'box-shadow 0.3s'
                }}
              >
                <AccordionSummary
                  expandIcon={<ChevronDown color={theme.palette.text.secondary} />}
                  sx={{
                    px: 3,
                    py: 1,
                    background: isExpanded 
                      ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)')
                      : 'transparent',
                    borderBottom: isExpanded ? `1px solid ${theme.palette.divider}` : 'none'
                  }}
                >
                  <Box display="flex" alignItems="center" gap={2}>
                    <Box 
                      sx={{ 
                        p: 1.2, 
                        borderRadius: '12px', 
                        background: `${modColor}20`,
                        color: modColor,
                        display: 'flex'
                      }}
                    >
                      {getModuleIcon(moduleName)}
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight="700" sx={{ textTransform: 'capitalize' }}>
                        {moduleName} Module
                      </Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight="600">
                        {groupedPermissions[moduleName].length} CAPABILITIES
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
                          px: 3,
                          py: 2.5,
                          borderBottom: index < groupedPermissions[moduleName].length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 2,
                          transition: 'background 0.2s',
                          '&:hover': { background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }
                        }}
                      >
                         <Box mt={0.5}>
                           <ShieldAlert size={18} color={theme.palette.text.disabled} />
                         </Box>
                         <Box flex={1}>
                           <Box display="flex" alignItems="center" gap={1.5} mb={0.5}>
                             <Typography variant="subtitle1" fontWeight="700" sx={{ fontFamily: 'monospace', letterSpacing: '-0.5px' }}>
                               {perm.name}
                             </Typography>
                             <Chip 
                               label={perm.scope}
                               size="small"
                               sx={{
                                 height: '20px',
                                 fontSize: '0.65rem',
                                 fontWeight: 700,
                                 textTransform: 'uppercase',
                                 background: perm.scope === 'global' ? `${theme.palette.error.main}1A` : `${theme.palette.success.main}1A`,
                                 color: perm.scope === 'global' ? theme.palette.error.main : theme.palette.success.main,
                                 border: `1px solid ${perm.scope === 'global' ? theme.palette.error.main : theme.palette.success.main}40`
                               }}
                             />
                           </Box>
                           <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
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
        })}

        {Object.keys(groupedPermissions).length === 0 && !loading && (
          <Box py={8} display="flex" flexDirection="column" alignItems="center" justifyContent="center" sx={{ opacity: 0.5 }}>
            <FolderLock size={48} style={{ marginBottom: '16px' }} />
            <Typography variant="h6">No permissions found</Typography>
          </Box>
        )}
      </Box>

      {/* Premium Create Modal */}
      <Dialog 
        open={modalOpen} 
        onClose={handleCloseModal} 
        maxWidth="sm" 
        fullWidth 
        TransitionComponent={Fade}
        PaperProps={{ 
          sx: { 
            borderRadius: '20px',
            background: theme.palette.mode === 'dark' ? '#1e1e1e' : '#ffffff',
            backgroundImage: 'none',
            boxShadow: theme.palette.mode === 'dark' ? '0 24px 48px rgba(0,0,0,0.5)' : '0 24px 48px rgba(0,0,0,0.1)'
          } 
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.25rem', pb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ p: 1, borderRadius: '8px', background: `${theme.palette.info.main}1A`, color: theme.palette.info.main, display: 'flex' }}>
            <FolderLock size={20} />
          </Box>
          Define New Capability
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Register a new system permission to govern access across modules.
          </Typography>
          <Box display="flex" flexDirection="column" gap={2.5}>
            <TextField
              label="Capability Name (e.g., users.create)"
              variant="filled"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              helperText="Follow dot notation standards"
              InputProps={{ disableUnderline: true, sx: { borderRadius: '12px' } }}
            />
            <Box display="flex" gap={2}>
              <TextField
                label="Module Category"
                variant="filled"
                fullWidth
                value={formData.module}
                onChange={(e) => setFormData({ ...formData, module: e.target.value })}
                InputProps={{ disableUnderline: true, sx: { borderRadius: '12px' } }}
              />
              <TextField
                  label="Execution Scope"
                  variant="filled"
                  fullWidth
                  value={formData.scope}
                  onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                  InputProps={{ disableUnderline: true, sx: { borderRadius: '12px' } }}
              />
            </Box>
            <TextField
              label="Functional Documentation"
              variant="filled"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              InputProps={{ disableUnderline: true, sx: { borderRadius: '12px' } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={handleCloseModal} color="inherit" sx={{ borderRadius: '10px', px: 3, fontWeight: 600 }}>Cancel</Button>
          <Button 
            variant="contained" 
            color="info" 
            onClick={handleSubmit} 
            disabled={!formData.name || !formData.module} 
            sx={{ 
              borderRadius: '10px', 
              px: 4, 
              fontWeight: 700,
              boxShadow: `0 8px 16px ${theme.palette.info.main}40`
            }}
          >
            Register Capability
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PermissionsPage;
