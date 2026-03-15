import React, { useEffect, useState, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Chip, 
  Avatar, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField, 
  MenuItem,
  useTheme,
  Fade,
  IconButton,
  InputAdornment
} from '@mui/material';
import { Eye, Edit2, Search, User, Briefcase, Mail, Calendar, ShieldCheck } from 'lucide-react';
import { toast } from 'react-toastify';
import { api } from '@services/api';
import ErrorBoundary from '@shared/components/ErrorBoundary';

interface Role {
  roles: {
    name: string;
  };
}

interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  department: string | null;
  created_at: string;
  role?: string;
  roles?: Role[];
}

const UserManagementPage: React.FC = () => {
    return (
        <ErrorBoundary>
            <UserManagementPageContent />
        </ErrorBoundary>
    );
}

const UserManagementPageContent: React.FC = () => {
  const theme = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ role: '', department: '' });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await api.fetchUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const handleView = (user: User) => {
    setSelectedUser(user);
    setIsViewOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      role: user.role || (user.roles?.[0]?.roles?.name) || 'student',
      department: user.department || ''
    });
    setIsEditOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    try {
      await api.updateUser(selectedUser.id, editForm);
      toast.success('System Personnel updated successfully');
      setIsEditOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update personnel record');
    }
  };

  return (
    <Box p={2} minHeight="calc(100vh - 100px)" display="flex" flexDirection="column">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <div>
          <Typography fontWeight="700" sx={{ fontSize: '1.875rem', color: theme.palette.text.primary, mb: 0.5 }}>
            Personnel Management
          </Typography>
          <Typography variant="body1" color="text.secondary">Oversee and modify system user accounts, departments, and roles.</Typography>
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
              width: '400px'
            }}
          >
            <TextField 
              variant="standard" 
              placeholder="Search personnel by name, email, department, or role..." 
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

      {/* Masonry Grid of User Cards */}
      {loading ? (
         <Typography color="text.secondary" textAlign="center" py={4}>Compiling personnel records...</Typography>
      ) : filteredUsers.length === 0 ? (
         <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={8} sx={{ opacity: 0.5 }}>
            <User size={64} style={{ marginBottom: '16px' }} />
            <Typography variant="h6">No personnel found</Typography>
         </Box>
      ) : (
        <Box 
          sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
            gap: 3 
          }}
        >
          {filteredUsers.map((user) => {
            const displayRole = user.role || (user.roles && user.roles.length > 0 ? user.roles[0].roles?.name : 'student');
            const isAdmin = displayRole?.toLowerCase() === 'admin';

            return (
              <Fade in={true} key={user.id}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: '20px',
                    border: `1px solid ${theme.palette.divider}`,
                    background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                      boxShadow: `0 12px 24px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)'}`,
                      borderColor: isAdmin ? theme.palette.secondary.main : theme.palette.primary.main
                    }
                  }}
                >
                  {/* Decorative Header Bar */}
                  <Box 
                    sx={{ 
                      position: 'absolute', 
                      top: 0, 
                      left: 0, 
                      right: 0, 
                      height: '4px', 
                      background: isAdmin 
                        ? `linear-gradient(90deg, ${theme.palette.secondary.main}, ${theme.palette.warning.main})` 
                        : `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.info.main})` 
                    }} 
                  />

                  {/* Header Row: Avatar + Name */}
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar 
                      src={user.avatar_url || undefined} 
                      sx={{ 
                        width: 56, 
                        height: 56,
                        border: `2px solid ${isAdmin ? theme.palette.secondary.main : theme.palette.primary.main}`,
                        boxShadow: `0 4px 12px ${isAdmin ? theme.palette.secondary.main : theme.palette.primary.main}40`
                      }}
                    />
                    <Box flex={1}>
                      <Typography variant="h6" fontWeight="800" sx={{ lineHeight: 1.2, mb: 0.5 }}>
                        {user.full_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Mail size={14} /> {user.email}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Badges Row */}
                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Chip 
                      icon={<ShieldCheck size={14} style={{ marginLeft: '6px' }} />} 
                      label={(displayRole || 'student').toLowerCase()} 
                      size="small" 
                      sx={{ 
                        height: 24, 
                        fontWeight: 700, 
                        fontSize: '0.7rem', 
                        textTransform: 'uppercase',
                        background: isAdmin ? `${theme.palette.secondary.main}20` : `${theme.palette.primary.main}20`,
                        color: isAdmin ? theme.palette.secondary.main : theme.palette.primary.main,
                        border: `1px solid ${isAdmin ? theme.palette.secondary.main : theme.palette.primary.main}40`
                      }} 
                    />
                    {user.department && (
                      <Chip 
                        icon={<Briefcase size={14} style={{ marginLeft: '6px' }} />} 
                        label={user.department} 
                        size="small" 
                        sx={{ 
                          height: 24, 
                          fontWeight: 600, 
                          fontSize: '0.75rem',
                          background: `${theme.palette.text.secondary}1A`,
                          color: theme.palette.text.secondary,
                        }} 
                      />
                    )}
                  </Box>

                  {/* Actions Row (Bottom) */}
                  <Box display="flex" justifyContent="space-between" alignItems="center" mt="auto" pt={1}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 500 }}>
                      <Calendar size={12} /> Joined {new Date(user.created_at).toLocaleDateString()}
                    </Typography>
                    <Box display="flex" gap={1}>
                      <IconButton size="small" onClick={() => handleView(user)} sx={{ color: theme.palette.text.secondary, '&:hover': { color: theme.palette.primary.main, background: `${theme.palette.primary.main}1A` }}}>
                        <Eye size={18} />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleEdit(user)} sx={{ color: theme.palette.text.secondary, '&:hover': { color: theme.palette.info.main, background: `${theme.palette.info.main}1A` }}}>
                        <Edit2 size={18} />
                      </IconButton>
                    </Box>
                  </Box>
                </Paper>
              </Fade>
            );
          })}
        </Box>
      )}

      {/* Premium View User Modal */}
      <Dialog 
        open={isViewOpen} 
        onClose={() => setIsViewOpen(false)} 
        maxWidth="xs" 
        fullWidth
        TransitionComponent={Fade}
        PaperProps={{ 
          sx: { 
            borderRadius: '24px',
            background: theme.palette.mode === 'dark' ? '#1e1e1e' : '#ffffff',
            backgroundImage: 'none',
            boxShadow: theme.palette.mode === 'dark' ? '0 24px 48px rgba(0,0,0,0.5)' : '0 24px 48px rgba(0,0,0,0.1)'
          } 
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.25rem', p: 3, pb: 0, textAlign: 'center' }}>
          Personnel Profile
        </DialogTitle>
        <DialogContent sx={{ p: 4, pt: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          {selectedUser && (
            <>
              <Avatar 
                src={selectedUser.avatar_url || undefined} 
                sx={{ 
                  width: 96, 
                  height: 96, 
                  mb: 2,
                  boxShadow: `0 8px 24px ${theme.palette.primary.main}40`,
                  border: `4px solid ${theme.palette.background.paper}`
                }} 
              />
              <Typography variant="h5" fontWeight="800" sx={{ mb: 0.5 }}>{selectedUser.full_name}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{selectedUser.email}</Typography>

              <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left', background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', p: 3, borderRadius: '16px' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" color="text.secondary" fontWeight="700" sx={{ textTransform: 'uppercase' }}>Department</Typography>
                  <Typography variant="body2" fontWeight="600">{selectedUser.department || 'Not Assigned'}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" color="text.secondary" fontWeight="700" sx={{ textTransform: 'uppercase' }}>Archetype / Role</Typography>
                  <Chip 
                    label={selectedUser.role || (selectedUser.roles?.[0]?.roles?.name) || 'Student'} 
                    size="small" 
                    sx={{ height: 20, fontSize: '0.7rem', fontWeight: 800, textTransform: 'capitalize', color: theme.palette.primary.main, background: `${theme.palette.primary.main}20` }}
                  />
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" color="text.secondary" fontWeight="700" sx={{ textTransform: 'uppercase' }}>Joined Date</Typography>
                  <Typography variant="body2" fontWeight="600">{new Date(selectedUser.created_at).toLocaleDateString()}</Typography>
                </Box>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, justifyContent: 'center' }}>
          <Button onClick={() => setIsViewOpen(false)} color="inherit" sx={{ borderRadius: '12px', px: 4, fontWeight: 600, width: '100%', background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
            Dismiss Overview
          </Button>
        </DialogActions>
      </Dialog>

      {/* Premium Edit User Modal */}
      <Dialog 
        open={isEditOpen} 
        onClose={() => setIsEditOpen(false)} 
        maxWidth="xs" 
        fullWidth
        TransitionComponent={Fade}
        PaperProps={{ 
          sx: { 
            borderRadius: '24px',
            background: theme.palette.mode === 'dark' ? '#1e1e1e' : '#ffffff',
            backgroundImage: 'none',
            boxShadow: theme.palette.mode === 'dark' ? '0 24px 48px rgba(0,0,0,0.5)' : '0 24px 48px rgba(0,0,0,0.1)'
          } 
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.25rem', p: 3, pb: 2, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ p: 1, borderRadius: '8px', background: `${theme.palette.info.main}1A`, color: theme.palette.info.main, display: 'flex' }}>
            <Edit2 size={20} />
          </Box>
          Modify Personnel Record
        </DialogTitle>
        <DialogContent sx={{ p: 3, pt: 3 }}>
          <Box display="flex" flexDirection="column" gap={3}>
            <TextField
              label="System Authority Role"
              select
              variant="filled"
              fullWidth
              value={editForm.role}
              onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
              InputProps={{ disableUnderline: true, sx: { borderRadius: '12px' } }}
            >
              <MenuItem value="student">Student</MenuItem>
              <MenuItem value="faculty">Faculty</MenuItem>
              <MenuItem value="security">Security</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </TextField>
            <TextField
              label="Department / Faculty"
              variant="filled"
              fullWidth
              value={editForm.department}
              onChange={(e) => setEditForm(prev => ({ ...prev, department: e.target.value }))}
              InputProps={{ disableUnderline: true, sx: { borderRadius: '12px' } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Button onClick={() => setIsEditOpen(false)} color="inherit" sx={{ borderRadius: '10px', px: 3, fontWeight: 600 }}>Cancel</Button>
          <Button 
            onClick={handleUpdateUser} 
            variant="contained" 
            color="info"
            sx={{ 
              borderRadius: '10px', 
              px: 4, 
              fontWeight: 700,
              boxShadow: `0 8px 16px ${theme.palette.info.main}40`
            }}
          >
            Commit Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagementPage;
