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
  InputAdornment
} from '@mui/material';
import { Search, UserCog, Shield, AlertCircle, Mail, MapPin, SearchSlash, Users } from 'lucide-react';
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
}

const UsersPage: React.FC = () => {
  const theme = useTheme();
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
      setUsers(usersRes);
      setRoles(rolesRes);
      if (usersRes.length > 0 && !selectedUser) {
        handleSelectUser(usersRes[0]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load system users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectUser = async (user: UserProfile) => {
    setSelectedUser(user);
    try {
      setRolesLoading(true);
      const res = await api.fetchUserRoles(user.id);
      setUserRoles(res || []);
    } catch (error) {
      toast.error('Failed to load roles for ' + user.full_name);
    } finally {
      setRolesLoading(false);
    }
  };

  const handleOpenAssignModal = () => {
    setSelectedRoleIds(userRoles.map(r => r.id));
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleToggleRoleSelection = (roleId: string) => {
    setSelectedRoleIds(prev => 
      prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
    );
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

      toast.success('Roles successfully applied');
      // Refresh the roles for the current user
      const updatedRoles = await api.fetchUserRoles(selectedUser.id);
      setUserRoles(updatedRoles);
      handleCloseModal();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update roles');
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

  // Utility to generate distinct colors per user avatar
  const getAvatarColor = (name: string) => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#f43f5e'];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <Box p={2} height="calc(100vh - 100px)" display="flex" flexDirection="column">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexShrink={0}>
        <div>
          <Typography fontWeight="700" sx={{ fontSize: '1.875rem', color: theme.palette.text.primary, mb: 0.5 }}>
            System Users Directory
          </Typography>
          <Typography variant="body1" color="text.secondary">Assign security groups and structural roles to users</Typography>
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
              placeholder="Search users..." 
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
        </Box>
      </Box>

      <Box display="flex" gap={3} flex={1} minHeight={0}>
        {/* Left Pane: User List */}
        <Paper 
          elevation={0}
          sx={{ 
            width: '35%', 
            minWidth: '320px',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '16px',
            border: `1px solid ${theme.palette.divider}`,
            background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0,0,0,0.01)',
            backdropFilter: 'blur(10px)',
            overflow: 'hidden'
          }}
        >

          
          <Box flex={1} overflow="auto" className="custom-scrollbar">
            {filteredUsers.length === 0 && !loading ? (
              <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" sx={{ opacity: 0.5 }}>
                <SearchSlash size={40} style={{ marginBottom: '16px' }} />
                <Typography>No users found</Typography>
              </Box>
            ) : (
              <List disablePadding>
                {filteredUsers.map(user => {
                  const isSelected = selectedUser?.id === user.id;
                  const bgColor = getAvatarColor(user.full_name || '?');
                  
                  return (
                    <ListItem 
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        background: isSelected 
                          ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)')
                          : 'transparent',
                        borderLeft: `4px solid ${isSelected ? theme.palette.primary.main : 'transparent'}`,
                        transition: 'all 0.2s',
                        '&:hover': {
                          background: isSelected ? undefined : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)')
                        }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ background: bgColor, fontWeight: 700 }}>
                          {(user.full_name || '?').charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={<Typography variant="subtitle2" fontWeight={isSelected ? 700 : 500}>{user.full_name || 'Unknown User'}</Typography>}
                        secondary={<Typography variant="caption" color="text.secondary">{user.department || 'No Dept'}</Typography>}
                      />
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Box>
        </Paper>

        {/* Right Pane: User Details & Roles */}
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            borderRadius: '16px',
            border: `1px solid ${theme.palette.divider}`,
            background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.01)' : '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          {selectedUser ? (
            <Fade in={true} key={selectedUser.id}>
              <Box height="100%" display="flex" flexDirection="column">
                {/* Profile Header Block */}
                <Box 
                  p={4} 
                  display="flex" 
                  alignItems="center" 
                  gap={3}
                  sx={{ 
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    background: `linear-gradient(180deg, ${getAvatarColor(selectedUser.full_name)}15 0%, transparent 100%)`
                  }}
                >
                  <Avatar 
                    sx={{ 
                      width: 80, 
                      height: 80, 
                      fontSize: '2rem', 
                      fontWeight: 700,
                      background: getAvatarColor(selectedUser.full_name),
                      boxShadow: `0 8px 24px ${getAvatarColor(selectedUser.full_name)}40`
                    }}
                  >
                    {(selectedUser.full_name || '?').charAt(0).toUpperCase()}
                  </Avatar>
                  <Box flex={1}>
                    <Typography variant="h4" fontWeight="800" mb={0.5}>{selectedUser.full_name || 'Unknown User'}</Typography>
                    <Box display="flex" alignItems="center" gap={3} color="text.secondary">
                      {selectedUser.email && (
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Mail size={16} /> <Typography variant="body2">{selectedUser.email}</Typography>
                        </Box>
                      )}
                      {selectedUser.department && (
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <MapPin size={16} /> <Typography variant="body2">{selectedUser.department}</Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={<UserCog size={18} />}
                    onClick={handleOpenAssignModal}
                    sx={{ borderRadius: '8px', px: 3, py: 1 }}
                  >
                    Assign Archetypes
                  </Button>
                </Box>

                {/* Assigned Roles Area */}
                <Box p={4} flex={1} overflow="auto" className="custom-scrollbar">
                  <Typography variant="h6" fontWeight="700" mb={3} display="flex" alignItems="center" gap={1}>
                    <Shield size={22} color={theme.palette.primary.main} />
                    Active Access Archetypes
                  </Typography>

                  {rolesLoading ? (
                    <Typography color="text.secondary">Analyzing access vectors...</Typography>
                  ) : userRoles.length === 0 ? (
                    <Box 
                      p={4} 
                      borderRadius="12px" 
                      border={`1px dashed ${theme.palette.divider}`}
                      display="flex" 
                      flexDirection="column" 
                      alignItems="center" 
                      justifyContent="center"
                      sx={{ opacity: 0.6 }}
                    >
                      <AlertCircle size={40} style={{ marginBottom: '16px' }} />
                      <Typography variant="subtitle1" fontWeight="600">No Archetypes Assigned</Typography>
                      <Typography variant="body2" color="text.secondary" textAlign="center" mt={1} maxWidth="300px">
                        This user currently has zero base permissions. Assign a role archetype to grant access to system capabilities.
                      </Typography>
                    </Box>
                  ) : (
                    <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(280px, 1fr))" gap={2}>
                      {userRoles.map(role => (
                         <Box
                           key={role.id}
                           sx={{
                             p: 2.5,
                             borderRadius: '12px',
                             border: `1px solid ${theme.palette.divider}`,
                             background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                             position: 'relative',
                             overflow: 'hidden'
                           }}
                         >
                           <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: theme.palette.primary.main }} />
                           <Typography variant="subtitle1" fontWeight="700" mb={0.5}>{role.name}</Typography>
                           <Typography variant="body2" color="text.secondary" sx={{ minHeight: '40px' }}>
                             {role.description || 'No description provided.'}
                           </Typography>
                         </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              </Box>
            </Fade>
          ) : (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" sx={{ opacity: 0.5 }}>
              <Users size={64} style={{ marginBottom: '16px' }} />
              <Typography variant="h6">Select a user to inspect</Typography>
            </Box>
          )}
        </Paper>
      </Box>

      {/* Premium Assignment Modal */}
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
            boxShadow: theme.palette.mode === 'dark' ? '0 24px 48px rgba(0,0,0,0.5)' : '0 24px 48px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          } 
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.25rem', p: 3, pb: 2, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ p: 1, borderRadius: '8px', background: `${theme.palette.primary.main}1A`, color: theme.palette.primary.main, display: 'flex' }}>
            <UserCog size={20} />
          </Box>
          Modify Archetypes for {selectedUser?.full_name}
        </DialogTitle>
        <DialogContent sx={{ p: 0, maxHeight: '400px' }}>
          <List disablePadding>
            {roles.map((role) => {
              const checked = selectedRoleIds.includes(role.id);
              return (
                <ListItem 
                  key={role.id} 
                  onClick={() => handleToggleRoleSelection(role.id)}
                  sx={{ 
                    cursor: 'pointer',
                    px: 3,
                    py: 2.5,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    background: checked ? (theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)') : 'transparent',
                    transition: 'background 0.2s',
                    '&:hover': { background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }
                  }}
                >
                  <Checkbox 
                    checked={checked} 
                    edge="start" 
                    disableRipple
                    sx={{ color: theme.palette.divider, '&.Mui-checked': { color: theme.palette.primary.main } }}
                  />
                  <Box ml={1.5}>
                    <Typography variant="subtitle1" fontWeight="700" color={checked ? 'primary.main' : 'text.primary'}>{role.name}</Typography>
                    <Typography variant="body2" color="text.secondary" mt={0.5}>{role.description || 'System Base Archetype'}</Typography>
                  </Box>
                </ListItem>
              );
            })}
          </List>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: `1px solid ${theme.palette.divider}`, background: theme.palette.background.default }}>
          <Button onClick={handleCloseModal} color="inherit" sx={{ borderRadius: '10px', px: 3, fontWeight: 600 }}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSaveRoles} 
            disabled={savingRoles}
            sx={{ 
              borderRadius: '10px', 
              px: 4, 
              fontWeight: 700,
              boxShadow: `0 8px 16px ${theme.palette.primary.main}40`
            }}
          >
            {savingRoles ? 'Applying...' : 'Apply Access Archetypes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsersPage;
