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
  Drawer,
  Chip,
  useTheme,
  Autocomplete,
  Fade,
  Divider,
  Stack,
  useMediaQuery,
  CircularProgress,
  Grid
} from '@mui/material';
import { Plus, Edit2, Trash2, Search, Shield, Key, X, Settings as SettingsIcon } from 'lucide-react';
import { api } from '@utils/services/api';
import { toast } from 'react-toastify';
import ErrorBoundary from '@shared/components/ErrorBoundary';

interface Role {
  id: string;
  name: string;
  description: string;
  is_system: boolean;
}

interface Permission {
  id: string;
  name: string;
  module: string;
  description: string;
  scope: string;
}

const RolesPage: React.FC = () => {
  return (
    <ErrorBoundary>
      <RolesPageContent />
    </ErrorBoundary>
  );
};

const RolesPageContent: React.FC = () => {
  const theme = useTheme();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Permission[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // UX Breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isExtraSmall = useMediaQuery('(max-width:400px)');

  // Modals & Drawers
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRoleForPermissions, setSelectedRoleForPermissions] = useState<Role | null>(null);

  // Reset modalOpen to false by default
  useEffect(() => {
    setModalOpen(false);
  }, []);

  // Delete Confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);

  // Adaptive Sizing (De-bulked)
  const controlHeight = isMobile ? '38px' : '44px';
  const controlFontSize = isMobile ? '0.8rem' : '0.9rem';
  const containerPadding = isExtraSmall ? 2 : isMobile ? 3 : 5;

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const data = await api.fetchRoles();
      setRoles(data);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPermissions = async () => {
    try {
      const data = await api.fetchPermissions();
      setPermissions(data);
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchAllPermissions();
  }, []);

  const handleOpenModal = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setFormData({ name: role.name, description: role.description });
    } else {
      setEditingRole(null);
      setFormData({ name: '', description: '' });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingRole(null);
    setFormData({ name: '', description: '' });
  };

  const handleSubmit = async () => {
    try {
      if (editingRole) {
        await api.updateRole(editingRole.id, formData);
        toast.success('Role updated');
      } else {
        await api.createRole(formData);
        toast.success('Role created');
      }
      fetchRoles();
      handleCloseModal();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err.message || 'Operation failed');
    }
  };

  const triggerDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRoleToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!roleToDelete) return;
    try {
      await api.deleteRole(roleToDelete);
      toast.success('Role removed');
      fetchRoles();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err.message || 'Deletion failed');
    } finally {
      setDeleteConfirmOpen(false);
      setRoleToDelete(null);
    }
  };

  const handleOpenDrawer = async (role: Role) => {
    setSelectedRoleForPermissions(role);
    setDrawerOpen(true);
    try {
      const data = await api.fetchRolePermissions(role.id);
      setRolePermissions(data);
    } catch (error) {
      toast.error('Failed to load permissions');
    }
  };

  const handleAssignPermission = async (permissionId: string) => {
    if (!selectedRoleForPermissions) return;
    try {
      await api.assignRolePermission(selectedRoleForPermissions.id, permissionId);
      toast.success('Permission added');
      const data = await api.fetchRolePermissions(selectedRoleForPermissions.id);
      setRolePermissions(data);
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err.message || 'Assignment failed');
    }
  };

  const handleRemovePermission = async (permissionId: string) => {
    if (!selectedRoleForPermissions) return;
    try {
      await api.removeRolePermission(selectedRoleForPermissions.id, permissionId);
      toast.success('Permission removed');
      const data = await api.fetchRolePermissions(selectedRoleForPermissions.id);
      setRolePermissions(data);
    } catch (error: any) {
      toast.error(error.message || 'Removal failed');
    }
  };

  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const unassignedPermissions = permissions.filter(p => !rolePermissions.find(rp => rp.id === p.id));

  const getAccentColor = (name: string) => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <Box p={containerPadding} display="flex" flexDirection="column" gap={isMobile ? 3 : 5}>
      
      {/* Search and Action Header */}
      <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} justifyContent="space-between" alignItems={isMobile ? 'flex-start' : 'center'} gap={4}>
        <Box>
          <Typography fontWeight="900" sx={{ fontSize: isExtraSmall ? '1.75rem' : isMobile ? '2.25rem' : '3.25rem', letterSpacing: '-0.03em', lineHeight: 1.1, color: theme.palette.text.primary, mb: 1 }}>
            Auth & Roles
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, opacity: 0.9 }}>
            Manage user permissions and access levels
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
                variant="standard" placeholder="Search roles..." fullWidth sx={{ ml: 1.5 }}
                InputProps={{ disableUnderline: true, style: { fontSize: controlFontSize, fontWeight: 600 } }}
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              />
          </Paper>

          <Button 
            variant="contained" 
            size="medium"
            onClick={() => handleOpenModal()}
            startIcon={<Plus size={18} />}
            sx={{ borderRadius: '12px', fontWeight: 900, height: controlHeight, px: 3, textTransform: 'none', width: isMobile ? '100%' : 'auto' }}
          >
            Add Role
          </Button>
        </Stack>
      </Box>

      {/* Roles Grid */}
      <Box flex={1}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={12}><CircularProgress thickness={5} size={70} /></Box>
        ) : filteredRoles.length === 0 ? (
          <Box textAlign="center" py={15} sx={{ opacity: 0.3 }}>
            <Shield size={100} strokeWidth={1} style={{ marginBottom: 20 }} />
            <Typography variant="h4" fontWeight="800">No Roles Found</Typography>
            <Typography variant="body1">Create a role to start managing permissions.</Typography>
          </Box>
        ) : (
          <Grid container spacing={isMobile ? 2 : 3}>
            {filteredRoles.map(role => {
              const accentColor = role.is_system ? theme.palette.primary.main : getAccentColor(role.name);
              return (
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={role.id}>
                  <Fade in={true}>
                    <Paper
                      onClick={() => handleOpenDrawer(role)}
                      sx={{
                        p: 3,
                        borderRadius: '24px',
                        border: `2px solid ${theme.palette.divider}`,
                        background: theme.palette.background.paper,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        '&:active': { transform: 'scale(0.98)' }
                      }}
                    >
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Box sx={{ p: 1.25, borderRadius: '12px', background: `${accentColor}10`, color: accentColor, display: 'flex' }}>
                          <Shield size={20} />
                        </Box>
                        <Box display="flex" gap={0.5}>
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleOpenModal(role); }} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '8px' }}>
                            <Edit2 size={14} />
                          </IconButton>
                          {!role.is_system && (
                            <IconButton size="small" color="error" onClick={(e) => triggerDelete(role.id, e)} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '8px' }}>
                              <Trash2 size={14} />
                            </IconButton>
                          )}
                        </Box>
                      </Box>

                      <Typography variant="body1" fontWeight="900" sx={{ mb: 0.5, lineHeight: 1.1 }}>{role.name}</Typography>
                      <Chip label={role.is_system ? 'System' : 'Custom'} size="small" sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.6rem', mb: 2, height: 20, width: 'fit-content', bgcolor: role.is_system ? `${theme.palette.primary.main}10` : 'rgba(0,0,0,0.04)' }} />
                      
                      <Typography variant="caption" color="text.secondary" sx={{ flex: 1, fontWeight: 500, lineHeight: 1.5, mb: 3 }}>
                        {role.description || 'No description provided.'}
                      </Typography>

                      <Box sx={{ pt: 1.5, borderTop: `1px solid ${theme.palette.divider}`, mt: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SettingsIcon size={12} style={{ opacity: 0.5 }} />
                        <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.6rem', letterSpacing: '0.04em' }}>Permissions</Typography>
                      </Box>
                    </Paper>
                  </Fade>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>

      {/* Permissions Side Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: isMobile ? '100%' : '440px', background: theme.palette.background.default, borderLeft: `1px solid ${theme.palette.divider}` } }}
      >
        {selectedRoleForPermissions && (
          <Box height="100%" display="flex" flexDirection="column">
            <Box p={isMobile ? 3 : 4} borderBottom={`1px solid ${theme.palette.divider}`} bgcolor={theme.palette.background.paper}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box sx={{ p: 1.25, borderRadius: '12px', background: `${theme.palette.primary.main}10`, color: theme.palette.primary.main }}>
                    <Key size={24} />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight="900">{selectedRoleForPermissions.name}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 900, fontSize: '0.65rem' }}>Assignment Map</Typography>
                  </Box>
                </Box>
                <IconButton size="small" onClick={() => setDrawerOpen(false)} sx={{ bgcolor: 'rgba(0,0,0,0.04)' }}>
                  <X size={18} />
                </IconButton>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, lineHeight: 1.4, display: 'block' }}>
                Control granular permissions for this role. System defaults are read-only.
              </Typography>
            </Box>

            <Box p={isMobile ? 3 : 4} flex={1} sx={{ overflowY: 'auto' }}>
              <Box mb={4}>
                <Typography variant="caption" fontWeight="900" mb={1} color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Add Permission</Typography>
                <Autocomplete
                  options={unassignedPermissions}
                  getOptionLabel={(option) => option.name}
                  disabled={selectedRoleForPermissions.is_system}
                  renderInput={(params) => <TextField {...params} variant="outlined" placeholder="Search capabilities..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: theme.palette.background.paper } }} />}
                  onChange={(_, newValue) => newValue && handleAssignPermission(newValue.id)}
                  value={null}
                />
                {selectedRoleForPermissions.is_system && (
                  <Typography variant="caption" color="warning.main" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, fontWeight: 700, fontSize: '0.65rem' }}>
                    <Shield size={10} /> System roles have locked permissions
                  </Typography>
                )}
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                 <Typography variant="caption" fontWeight="900" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assigned List</Typography>
                 <Chip label={rolePermissions.length} size="small" sx={{ fontWeight: 900, borderRadius: '6px', height: 20, fontSize: '0.65rem' }} />
              </Box>

              <Stack spacing={1.5}>
                {rolePermissions.map(rp => (
                  <Paper 
                    key={rp.id}
                    elevation={0}
                    sx={{ p: 2, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, background: theme.palette.background.paper, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Box display="flex" alignItems="center" gap={1} mb={0.25}>
                        <Typography variant="caption" fontWeight="900">{rp.name}</Typography>
                        <Chip label={rp.module} size="small" sx={{ height: 16, fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase' }} />
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.65rem' }}>{rp.description}</Typography>
                    </Box>
                    {!selectedRoleForPermissions.is_system && (
                      <IconButton size="small" color="error" onClick={() => handleRemovePermission(rp.id)} sx={{ bgcolor: `${theme.palette.error.main}08`, ml: 1 }}>
                        <X size={14} />
                      </IconButton>
                    )}
                  </Paper>
                ))}
              </Stack>
            </Box>
          </Box>
        )}
      </Drawer>

      {/* Refined Add/Edit Role Dialog (De-bulked) */}
      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="xs" fullWidth TransitionComponent={Fade} PaperProps={{ sx: { borderRadius: '24px' } }}>
        <DialogTitle sx={{ fontWeight: 900, p: 0 }}>
           <Box sx={{ p: isMobile ? 2.5 : 3, bgcolor: `${theme.palette.primary.main}08`, color: theme.palette.primary.main, borderRadius: '24px 24px 0 0', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1, borderRadius: '10px', bgcolor: 'white', display: 'flex', boxShadow: theme.shadows[2] }}><Shield size={18} /></Box>
              <Box>
                <Typography variant="body1" fontWeight="900">{editingRole ? 'Edit Role' : 'Create Role'}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 700, fontSize: '0.65rem' }}>Adjust access levels</Typography>
              </Box>
              <IconButton size="small" onClick={handleCloseModal} sx={{ ml: 'auto', bgcolor: theme.palette.mode==='dark'?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.05)', color: 'inherit' }}><X size={16} /></IconButton>
           </Box>
        </DialogTitle>
        <DialogContent sx={{ p: isMobile ? 2.5 : 3.5, pt: isMobile ? 3 : 4 }}>
          <Stack spacing={3}>
            <Box>
               <Typography variant="caption" fontWeight="800" color="text.secondary" sx={{ ml: 1.5, mb: 0.75, display: 'block', textTransform: 'uppercase', fontSize: '0.65rem' }}>Role Designation</Typography>
               <TextField variant="filled" fullWidth value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} InputProps={{ disableUnderline: true, sx: { borderRadius: '14px', fontWeight: 700, height: 44 } }} />
            </Box>
            <Box>
               <Typography variant="caption" fontWeight="800" color="text.secondary" sx={{ ml: 1.5, mb: 0.75, display: 'block', textTransform: 'uppercase', fontSize: '0.65rem' }}>Functional Scope</Typography>
               <TextField variant="filled" fullWidth multiline rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} InputProps={{ disableUnderline: true, sx: { borderRadius: '14px', fontWeight: 700, p: 1.5 } }} />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: isMobile ? 2.5 : 3.5, pt: 0 }}>
          <Button onClick={handleSubmit} disabled={!formData.name} fullWidth variant="contained" size="large" sx={{ borderRadius: '14px', py: 1.5, fontWeight: 900, textTransform: 'none', boxShadow: 3 }}>{editingRole ? 'Save Updates' : 'Commit Role'}</Button>
        </DialogActions>
      </Dialog>

      {/* Refined Delete Confirmation Dialog (De-bulked) */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} TransitionComponent={Fade} PaperProps={{ sx: { borderRadius: '24px', p: 0.5, maxWidth: '380px', textAlign: 'center' } }}>
        <DialogContent sx={{ pt: isMobile ? 4 : 5, pb: 3 }}>
          <Box display="flex" justifyContent="center" mb={3}>
            <Box sx={{ p: 2, borderRadius: '50%', background: `${theme.palette.error.main}10`, color: theme.palette.error.main, animation: 'pulse 2s infinite ease-in-out' }}>
              <Trash2 size={32} />
            </Box>
          </Box>
          <Typography variant="h6" fontWeight="900" sx={{ mb: 1.5 }}>Permanently Remove?</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, px: 2, display: 'block', lineHeight: 1.5 }}>
            This will revoke access for all assigned users. This action cannot be reversed.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 4, px: 3, gap: 1.5 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} fullWidth variant="outlined" color="inherit" size="medium" sx={{ borderRadius: '12px', fontWeight: 800, borderWidth: 2 }}>Cancel</Button>
          <Button onClick={confirmDelete} fullWidth variant="contained" color="error" size="medium" sx={{ borderRadius: '12px', fontWeight: 900, boxShadow: 4 }}>Delete Role</Button>
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

export default RolesPage;
