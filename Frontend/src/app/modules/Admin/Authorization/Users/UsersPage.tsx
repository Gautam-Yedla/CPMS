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
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  useTheme,
  Fade,
  Checkbox,
  CircularProgress,
  useMediaQuery,
  IconButton,
  Chip
} from '@mui/material';
import { Search, UserCog, Shield, AlertCircle, Mail, MapPin, SearchSlash, Users, X } from 'lucide-react';
import { api } from '@utils/services/api';
import { toast } from 'react-toastify';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  department: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  is_system?: boolean;
  permissionsList?: { name: string; description: string }[];
}

const UsersPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isExtraSmall = useMediaQuery('(max-width:400px)');

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userRoles, setUserRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [savingRoles, setSavingRoles] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes] = await Promise.all([
        api.fetchUsers(),
        api.fetchRoles()
      ]);
      if (Array.isArray(usersRes)) {
          setUsers(usersRes);
          if (usersRes.length > 0 && !selectedUser) {
            handleSelectUser(usersRes[0]);
          }
      }
      if (Array.isArray(rolesRes)) setRoles(rolesRes);
    } catch (error) {
      toast.error('Failed to load system access records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectUser = async (user: UserProfile) => {
    setSelectedUser(user);
    try {
      setRolesLoading(true);
      const res = await api.fetchUserRoles(user.id);
      setUserRoles(Array.isArray(res) ? res : []);
    } catch (error) {
      toast.error('Failed to load access roles');
    } finally {
      setRolesLoading(false);
    }
  };

  const handleOpenAssignModal = () => {
    setSelectedRoleIds(userRoles.map(r => r.id));
    setModalOpen(true);
  };

  const handleSaveRoles = async () => {
    if (!selectedUser) return;
    try {
      setSavingRoles(true);
      const currentRoleIds = userRoles.map(r => r.id);
      const toAdd = selectedRoleIds.filter(id => !currentRoleIds.includes(id));
      const toRemove = currentRoleIds.filter(id => !selectedRoleIds.includes(id));

      await Promise.all([
        ...toAdd.map(roleId => api.assignUserRole(selectedUser.id, roleId)),
        ...toRemove.map(roleId => api.removeUserRole(selectedUser.id, roleId))
      ]);

      toast.success('System Access Updated');
      const updatedRoles = await api.fetchUserRoles(selectedUser.id);
      setUserRoles(Array.isArray(updatedRoles) ? updatedRoles : []);
      setModalOpen(false);
    } catch (error) {
      toast.error('Failed to synchronize access roles');
    } finally {
      setSavingRoles(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const getAvatarColor = (name: string) => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#f43f5e'];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <Box sx={{ p: isMobile ? 2 : 4, height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Premium Header Section */}
      <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: 3, flexShrink: 0 }}>
        <Box>
          <Typography variant="h4" fontWeight="800" color="text.primary" sx={{ letterSpacing: '-0.02em', mb: 0.5 }}>User Access Directory</Typography>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>Strategic assignment of security roles and system permissions.</Typography>
        </Box>
        <Paper elevation={0} sx={{ p: 1, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', width: isMobile ? '100%' : '320px', bgcolor: theme.palette.background.paper }}>
            <Box sx={{ pl: 1.5, display: 'flex' }}><Search size={18} color={theme.palette.text.secondary} /></Box>
            <TextField variant="standard" placeholder="Search access records..." fullWidth sx={{ ml: 1.5 }} InputProps={{ disableUnderline: true, style: { fontWeight: 600, fontSize: '0.9rem' } }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </Paper>
      </Box>

      {/* Main Content Area */}
      <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 3, flex: 1, minHeight: 0 }}>
        {/* Personnel List Pane */}
        <Paper elevation={0} sx={{ width: isMobile ? '100%' : '380px', display: 'flex', flexDirection: 'column', borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', overflow: 'hidden' }}>
          <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.background.paper }}>
              <Typography variant="caption" fontWeight="800" color="text.secondary">PERSONNEL LIST</Typography>
          </Box>
          <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
            {loading ? (
                 <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress size={24} /></Box>
            ) : filteredUsers.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 5, opacity: 0.4 }}><SearchSlash size={32} style={{ marginBottom: 8 }} /><Typography variant="caption" sx={{ display: 'block' }}>No matching personnel</Typography></Box>
            ) : (
              <List disablePadding>
                {filteredUsers.map(user => {
                  const isSelected = selectedUser?.id === user.id;
                  const bgColor = getAvatarColor(user.full_name || '?');
                  return (
                    <ListItem key={user.id} onClick={() => handleSelectUser(user)} sx={{ mb: 0.5, borderRadius: '12px', cursor: 'pointer', bgcolor: isSelected ? `${theme.palette.primary.main}12` : 'transparent', border: `1px solid ${isSelected ? theme.palette.primary.main : 'transparent'}`, transition: 'all 0.2s', '&:hover': { bgcolor: isSelected ? undefined : 'rgba(0,0,0,0.03)' } }}>
                      <ListItemAvatar><Avatar sx={{ background: bgColor, fontWeight: 800, width: 36, height: 36, fontSize: '0.9rem' }}>{(user.full_name || '?').charAt(0).toUpperCase()}</Avatar></ListItemAvatar>
                      <ListItemText primary={<Typography variant="subtitle2" fontWeight="800" color={isSelected ? 'primary' : 'text.primary'}>{user.full_name}</Typography>} secondary={<Typography variant="caption" color="text.secondary">{user.department || 'General'}</Typography>} />
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Box>
        </Paper>

        {/* Access Detail Pane */}
        <Paper elevation={0} sx={{ flex: 1, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.background.paper, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {selectedUser ? (
             <Fade in={true} key={selectedUser.id}>
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {/* Detail Header */}
                    <Box sx={{ p: isMobile ? 3 : 4, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', flexDirection: isExtraSmall ? 'column' : 'row', alignItems: 'center', gap: 3, bgcolor: `${getAvatarColor(selectedUser.full_name)}08` }}>
                        <Avatar sx={{ width: 80, height: 80, fontSize: '2rem', fontWeight: 800, background: getAvatarColor(selectedUser.full_name), boxShadow: theme.shadows[4] }}>{(selectedUser.full_name || '?').charAt(0).toUpperCase()}</Avatar>
                        <Box sx={{ flex: 1, textAlign: isExtraSmall ? 'center' : 'left' }}>
                            <Typography variant="h5" fontWeight="900" color="text.primary">{selectedUser.full_name}</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 0.5, opacity: 0.7, justifyContent: isExtraSmall ? 'center' : 'flex-start' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Mail size={14} /><Typography variant="caption" fontWeight="700">{selectedUser.email}</Typography></Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><MapPin size={14} /><Typography variant="caption" fontWeight="700">{selectedUser.department}</Typography></Box>
                            </Box>
                        </Box>
                        <Button variant="contained" startIcon={<UserCog size={18} />} onClick={handleOpenAssignModal} sx={{ borderRadius: '12px', fontWeight: 800, textTransform: 'none', px: 3 }}>Manage Access Roles</Button>
                    </Box>

                    {/* Active Roles Grid */}
                    <Box sx={{ p: isMobile ? 3 : 4, flex: 1, overflow: 'auto' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
                            <Shield size={24} color={theme.palette.primary.main} />
                            <Typography variant="subtitle1" fontWeight="800">Assigned System Roles</Typography>
                        </Box>
                        {rolesLoading ? (
                             <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress thickness={5} /></Box>
                        ) : userRoles.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 10, opacity: 0.4, border: `1px dashed ${theme.palette.divider}`, borderRadius: '16px', bgcolor: 'rgba(0,0,0,0.01)' }}>
                                <AlertCircle size={40} style={{ margin: '0 auto 16px' }} />
                                <Typography variant="subtitle2" fontWeight={800}>No Roles Assigned</Typography>
                                <Typography variant="caption">Grant access to manage security and system policies</Typography>
                            </Box>
                        ) : (
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2 }}>
                                {userRoles.map(role => (
                                    <Paper key={role.id} elevation={0} sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, position: 'relative', overflow: 'hidden' }}>
                                        <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: theme.palette.primary.main }} />
                                        <Typography variant="subtitle2" fontWeight="800" sx={{ mb: 0.5 }}>{role.name}</Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>{role.description || 'Global system permissions.'}</Typography>
                                        
                                        {role.permissionsList && role.permissionsList.length > 0 && (
                                            <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {role.permissionsList.map(p => (
                                                    <Chip 
                                                        key={p.name} 
                                                        label={p.name} 
                                                        size="small" 
                                                        title={p.description}
                                                        sx={{ 
                                                            fontSize: '0.65rem', 
                                                            height: '20px', 
                                                            fontWeight: 700,
                                                            bgcolor: `${theme.palette.primary.main}15`,
                                                            color: theme.palette.primary.main
                                                        }} 
                                                    />
                                                ))}
                                            </Box>
                                        )}
                                    </Paper>
                                ))}
                            </Box>
                        )}
                    </Box>
                </Box>
             </Fade>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.3 }}>
                 <Users size={64} style={{ marginBottom: 16 }} />
                 <Typography variant="h6" fontWeight="800">Select Personnel Record</Typography>
            </Box>
          )}
        </Paper>
      </Box>

      {/* Role Assignment Dialog (Standardized) */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 900, p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>Update Security Access <IconButton onClick={() => setModalOpen(false)} size="small"><X size={20}/></IconButton></DialogTitle>
        <DialogContent sx={{ p: 0, maxHeight: '450px' }}>
             <List disablePadding>
                {roles.map(role => {
                    const checked = selectedRoleIds.includes(role.id);
                    return (
                        <ListItem key={role.id} onClick={() => setSelectedRoleIds(p=>p.includes(role.id)?p.filter(id=>id!==role.id):[...p,role.id])} sx={{ px: 3, py: 2.5, cursor: 'pointer', borderBottom: `1px solid ${theme.palette.divider}`, bgcolor: checked ? `${theme.palette.primary.main}08` : 'transparent' }}>
                            <Checkbox checked={checked} edge="start" sx={{ color: theme.palette.divider, '&.Mui-checked': { color: theme.palette.primary.main } }} />
                            <Box sx={{ ml: 2 }}>
                                <Typography variant="subtitle2" fontWeight="800" color={checked ? 'primary' : 'text.primary'}>{role.name}</Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>{role.description || 'Base System Role'}</Typography>
                            </Box>
                        </ListItem>
                    );
                })}
             </List>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setModalOpen(false)} variant="outlined" sx={{ borderRadius: '10px', fontWeight: 800, textTransform: 'none' }}>Cancel</Button>
            <Button variant="contained" disabled={savingRoles} onClick={handleSaveRoles} sx={{ borderRadius: '10px', fontWeight: 800, textTransform: 'none', px: 4 }}>{savingRoles ? 'Synchronizing...' : 'Apply Access Roles'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsersPage;
