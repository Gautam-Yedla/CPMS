import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  IconButton, 
  Tooltip,
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
  InputAdornment,
  Divider
} from '@mui/material';
import { Plus, Edit2, Trash2, Search, Shield, Key, X, Settings as SettingsIcon } from 'lucide-react';
import { api } from '@utils/services/api';
import { toast } from 'react-toastify';

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
  const theme = useTheme();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Permission[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals & Drawers
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRoleForPermissions, setSelectedRoleForPermissions] = useState<Role | null>(null);

  // Custom Delete Confirm State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);

  const fetchRoles = async () => {
    try {
      const data = await api.fetchRoles();
      setRoles(data);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Failed to load roles');
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
        toast.success('Role updated successfully');
      } else {
        await api.createRole(formData);
        toast.success('Role created successfully');
      }
      fetchRoles();
      handleCloseModal();
    } catch (error: any) {
      toast.error(error.message || 'Operation failed');
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
      toast.success('Role deleted successfully');
      fetchRoles();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete role');
    } finally {
      setDeleteConfirmOpen(false);
      setRoleToDelete(null);
    }
  };

  const handleEditClick = (role: Role, e: React.MouseEvent) => {
    e.stopPropagation();
    handleOpenModal(role);
  };

  // Drawer Methods
  const handleOpenDrawer = async (role: Role) => {
    setSelectedRoleForPermissions(role);
    setDrawerOpen(true);
    try {
      const data = await api.fetchRolePermissions(role.id);
      setRolePermissions(data);
    } catch (error) {
      toast.error('Failed to load assigned permissions');
    }
  };

  const handleAssignPermission = async (permissionId: string) => {
    if (!selectedRoleForPermissions) return;
    try {
      await api.assignRolePermission(selectedRoleForPermissions.id, permissionId);
      toast.success('Permission assigned');
      const data = await api.fetchRolePermissions(selectedRoleForPermissions.id);
      setRolePermissions(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to assign permission');
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
      toast.error(error.message || 'Failed to remove permission');
    }
  };

  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Unassigned permissions for the autocomplete dropdown
  const unassignedPermissions = permissions.filter(p => !rolePermissions.find(rp => rp.id === p.id));

  // Determine accent color via simple hash
  const getAccentColor = (name: string) => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <Box p={2}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <div>
          <Typography fontWeight="700" sx={{ fontSize: '1.875rem', color: theme.palette.text.primary, mb: 0.5 }}>
            Role Archetypes
          </Typography>
          <Typography variant="body1" color="text.secondary">Architect the permissions and capabilities of system actors.</Typography>
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
              width: '280px'
            }}
          >
            <TextField 
              variant="standard" 
              placeholder="Search archetypes..." 
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
            startIcon={<Plus size={20} />}
            onClick={() => handleOpenModal()}
            sx={{ borderRadius: '12px', boxShadow: '0 8px 16px rgba(99, 102, 241, 0.25)', px: 3, height: '42px' }}
          >
            Create Role
          </Button>
        </Box>
      </Box>

      {/* Masonry Grid of Glassmorphism Cards */}
      <Box 
        sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', 
          gap: 3 
        }}
      >
        {filteredRoles.map(role => {
          const accentColor = role.is_system ? '#ef4444' : getAccentColor(role.name);
          return (
            <Fade in={true} key={role.id}>
              <Paper
                onClick={() => handleOpenDrawer(role)}
                sx={{
                  position: 'relative',
                  p: 3,
                  borderRadius: '16px',
                  background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  minHeight: '200px',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow: theme.palette.mode === 'dark' 
                      ? `0 12px 24px rgba(0, 0, 0, 0.5), 0 0 0 1px ${accentColor}40`
                      : `0 12px 24px rgba(0, 0, 0, 0.1), 0 0 0 1px ${accentColor}40`,
                    '& .hover-bg': {
                      opacity: 0.05
                    }
                  }
                }}
              >
                {/* Accent Glow Background */}
                <Box 
                  className="hover-bg"
                  sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '150px',
                    height: '150px',
                    background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)`,
                    opacity: 0.02,
                    transition: 'opacity 0.3s',
                    transform: 'translate(30%, -30%)',
                    zIndex: 0
                  }}
                />

                <Box display="flex" justifyContent="space-between" alignItems="flex-start" zIndex={1}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Box 
                      sx={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: '10px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        background: `${accentColor}1A`,
                        color: accentColor
                      }}
                    >
                      <Shield size={22} />
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight="700" sx={{ lineHeight: 1.2 }}>
                        {role.name}
                      </Typography>
                      <Chip 
                        label={role.is_system ? 'System' : 'Custom'} 
                        size="small" 
                        sx={{ 
                          height: '20px', 
                          fontSize: '0.65rem', 
                          mt: 0.5,
                          fontWeight: 700,
                          background: role.is_system ? `${accentColor}1A` : `${theme.palette.text.disabled}1A`,
                          color: role.is_system ? accentColor : theme.palette.text.secondary,
                        }} 
                      />
                    </Box>
                  </Box>
                  <Box display="flex" gap={0.5} ml={2}>
                    <Tooltip title="Edit Role">
                      <IconButton size="small" onClick={(e) => handleEditClick(role, e)} sx={{ background: 'rgba(128,128,128,0.05)' }}>
                        <Edit2 size={14} />
                      </IconButton>
                    </Tooltip>
                    {!role.is_system && (
                      <Tooltip title="Delete Role">
                        <IconButton size="small" color="error" onClick={(e) => triggerDelete(role.id, e)} sx={{ background: 'rgba(239, 68, 68, 0.05)' }}>
                          <Trash2 size={14} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mt: 3, mb: 3, flex: 1, zIndex: 1, lineHeight: 1.6 }}>
                  {role.description || 'No description provided for this role archetype.'}
                </Typography>

                <Box display="flex" alignItems="center" justifyContent="space-between" zIndex={1}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: accentColor, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <SettingsIcon size={14} /> View Map
                  </Typography>
                </Box>
              </Paper>
            </Fade>
          );
        })}
      </Box>

      {/* Permissions Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: '400px', md: '500px' },
            background: theme.palette.background.default,
            p: 0
          }
        }}
      >
        {selectedRoleForPermissions && (
          <Box height="100%" display="flex" flexDirection="column">
            {/* Drawer Header */}
            <Box 
              p={4} 
              sx={{ 
                background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
                borderBottom: `1px solid ${theme.palette.divider}`
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Box sx={{ p: 1, borderRadius: '8px', background: `${theme.palette.primary.main}1A`, color: theme.palette.primary.main }}>
                    <Key size={24} />
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight="800">{selectedRoleForPermissions.name}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                      Permission Mapping
                    </Typography>
                  </Box>
                </Box>
                <IconButton onClick={() => setDrawerOpen(false)}>
                  <X />
                </IconButton>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Authorize this role to perform explicit capabilities. System roles represent core archetypes.
              </Typography>
            </Box>

            {/* Assignment Form */}
            <Box p={4} pb={2}>
              <Typography variant="subtitle2" fontWeight="700" mb={1.5} color="text.secondary">GRANT NEW PERMISSION</Typography>
              <Autocomplete
                options={unassignedPermissions}
                getOptionLabel={(option) => option.name}
                renderInput={(params) => <TextField {...params} label="Search capabilities..." variant="outlined" />}
                onChange={(_, newValue) => {
                  if (newValue) {
                    handleAssignPermission(newValue.id);
                  }
                }}
                disabled={selectedRoleForPermissions.is_system}
                value={null}
              />
              {selectedRoleForPermissions.is_system && (
                <Typography variant="caption" color="warning.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                  <Shield size={12} /> System mappings are immutable
                </Typography>
              )}
            </Box>

            <Divider />

            {/* List of current permissions */}
            <Box p={4} flex={1} overflow="auto">
               <Typography variant="subtitle2" fontWeight="700" mb={3} color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  AUTHORIZED CAPABILITIES <Chip label={rolePermissions.length} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
               </Typography>
               <Box display="flex" flexDirection="column" gap={2}>
                 {rolePermissions.length === 0 ? (
                    <Box textAlign="center" py={4} sx={{ opacity: 0.5 }}>
                      <Key size={32} style={{ marginBottom: '8px' }} />
                      <Typography>No permissions authorized</Typography>
                    </Box>
                 ) : (
                    rolePermissions.map(rp => (
                      <Box 
                        key={rp.id}
                        sx={{
                          p: 2,
                          borderRadius: '12px',
                          border: `1px solid ${theme.palette.divider}`,
                          background: theme.palette.background.paper,
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: 2,
                          transition: 'background 0.2s',
                          '&:hover': { background: theme.palette.action.hover }
                        }}
                      >
                        <Box>
                          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                            <Typography variant="body2" fontWeight="700">{rp.name}</Typography>
                            <Chip label={rp.module} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
                          </Box>
                          <Typography variant="caption" color="text.secondary">{rp.description}</Typography>
                        </Box>
                        {!selectedRoleForPermissions.is_system && (
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleRemovePermission(rp.id)}
                            sx={{ mt: -0.5, mr: -0.5 }}
                          >
                            <X size={16} />
                          </IconButton>
                        )}
                      </Box>
                    ))
                 )}
               </Box>
            </Box>
          </Box>
        )}
      </Drawer>

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
          <Box sx={{ p: 1, borderRadius: '8px', background: `${theme.palette.primary.main}1A`, color: theme.palette.primary.main, display: 'flex' }}>
            <Shield size={20} />
          </Box>
          {editingRole ? 'Edit Role Archetype' : 'Define New Archetype'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={3}>
            {editingRole ? 'Update the details for this security role.' : 'Create a new structural role to assign permissions to users.'}
          </Typography>
          <Box display="flex" flexDirection="column" gap={2.5}>
            <TextField
              label="Role Designation"
              variant="filled"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              InputProps={{ disableUnderline: true, sx: { borderRadius: '12px' } }}
            />
            <TextField
              label="Functional Description"
              variant="filled"
              fullWidth
              multiline
              rows={4}
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
            onClick={handleSubmit} 
            disabled={!formData.name} 
            sx={{ 
              borderRadius: '10px', 
              px: 4, 
              fontWeight: 700,
              boxShadow: `0 8px 16px ${theme.palette.primary.main}40`
            }}
          >
            {editingRole ? 'Commit Updates' : 'Generate'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog 
        open={deleteConfirmOpen} 
        onClose={() => setDeleteConfirmOpen(false)}
        TransitionComponent={Fade}
        PaperProps={{ 
          sx: { 
            borderRadius: '20px', 
            p: 1,
            maxWidth: '400px',
            textAlign: 'center'
          } 
        }}
      >
        <DialogContent sx={{ pt: 4, pb: 2 }}>
          <Box display="flex" justifyContent="center" mb={2}>
            <Box sx={{ p: 2, borderRadius: '50%', background: `${theme.palette.error.main}1A`, color: theme.palette.error.main }}>
              <Trash2 size={40} />
            </Box>
          </Box>
          <Typography variant="h6" fontWeight="700" mb={1}>Delete Archetype?</Typography>
          <Typography variant="body2" color="text.secondary">
            This action cannot be undone. Any users assigned to this role will lose its associated permissions.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3, gap: 1 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit" sx={{ borderRadius: '10px', px: 3, fontWeight: 600 }}>Cancel</Button>
          <Button 
            onClick={confirmDelete} 
            variant="contained" 
            color="error" 
            sx={{ borderRadius: '10px', px: 4, fontWeight: 700, boxShadow: `0 8px 16px ${theme.palette.error.main}40` }}
          >
            Yes, Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RolesPage;
