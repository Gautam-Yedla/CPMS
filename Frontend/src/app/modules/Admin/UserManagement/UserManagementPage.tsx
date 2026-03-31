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
  FormControl,
  InputLabel,
  Select,
  Stack,
  useMediaQuery,
  CircularProgress,
  Checkbox,
  Divider,
  Pagination
} from '@mui/material';
import { Edit2, Search, ShieldCheck, X, RefreshCcw } from 'lucide-react';
import { toast } from 'react-toastify';
import { api } from '@utils/services/api';
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
  is_approved?: boolean;
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
  
  // UX Breakpoints (Standardized)
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isExtraSmall = useMediaQuery('(max-width:400px)');
  const isTinyMobile = useMediaQuery('(max-width:340px)');

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkRoleAnchor, setBulkRoleAnchor] = useState<null | HTMLElement>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = isMobile ? 6 : 9;
  
  // Modals & Filters
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ role: '', department: '' });
  const [viewMode, setViewMode] = useState<'all' | 'pending'>('all');
  const [roleFilter, setRoleFilter] = useState('All');
  const [deptFilter] = useState('All');

  // Standard Semantic Colors
  const COLORS = {
      primary: theme.palette.primary.main,
      active: '#10b981', // Emerald
      pending: '#f59e0b', // Amber
      suspended: '#64748b' // Slate
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await api.fetchUsers();
      if (Array.isArray(data)) setUsers(data);
    } catch (error) {
      toast.error('Failed to load personnel records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = 
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const role = (u.role || u.roles?.[0]?.roles?.name || '').toLowerCase();
      const matchesRole = roleFilter === 'All' || role === roleFilter.toLowerCase();
      const matchesDept = deptFilter === 'All' || u.department === deptFilter;
      const matchesMode = viewMode === 'all' || (viewMode === 'pending' && u.is_approved === false);

      return matchesSearch && matchesRole && matchesDept && matchesMode;
    });
  }, [users, searchTerm, roleFilter, deptFilter, viewMode]);

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
      toast.success('Access level updated');
      setIsEditOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error('Refine user failed');
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      await api.approveUser(userId);
      toast.success('Access granted');
      fetchUsers();
    } catch (error) {
      toast.error('Activation failed');
    }
  };

  const handleApproveAll = async () => {
    if (selectedIds.length === 0) return;
    try {
      await Promise.all(selectedIds.map(id => api.approveUser(id)));
      toast.success(`Access granted to ${selectedIds.length} personnel`);
      setSelectedIds([]);
      setSelectionMode(false);
      fetchUsers();
    } catch (error) {
      toast.error('Batch activation failed');
    }
  };

  const handleBatchRoleChange = async (newRole: string) => {
    try {
      await Promise.all(selectedIds.map(id => api.updateUser(id, { role: newRole })));
      toast.success(`Designations updated for ${selectedIds.length} personnel`);
      setBulkRoleAnchor(null);
      setSelectedIds([]);
      setSelectionMode(false);
      fetchUsers();
    } catch (error) {
      toast.error('Batch update failed');
    }
  };

  return (
    <Box sx={{ p: isTinyMobile ? 1.5 : isMobile ? 2 : 4, minHeight: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', gap: 3, position: 'relative' }}>
      
      {/* Selection Mode Overlay */}
      <Fade in={selectionMode}>
        <Box 
          sx={{ 
            position: 'absolute', top: 0, left: 0, right: 0, 
            height: isMobile ? '60px' : '84px',
            bgcolor: COLORS.primary, color: 'white',
            zIndex: 1100, display: selectionMode ? 'flex' : 'none',
            alignItems: 'center', px: isMobile ? 2 : 5, justifyContent: 'space-between',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            borderRadius: '0 0 16px 16px'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ShieldCheck size={isMobile ? 24 : 32} />
            <Typography variant={isMobile ? "body2" : "h6"} fontWeight="800">{selectedIds.length} Personnel Selected</Typography>
          </Box>
          <Button 
            variant="outlined" color="inherit" size="small"
            onClick={() => setSelectedIds(selectedIds.length === filteredUsers.length ? [] : filteredUsers.map(u => u.id))} 
            sx={{ fontWeight: 800, borderRadius: '8px', px: 2, borderColor: 'rgba(255,255,255,0.4)', textTransform: 'none' }}
          >
            {selectedIds.length === filteredUsers.length ? 'Clear' : 'Select All'}
          </Button>
        </Box>
      </Fade>

      {/* Modern Header Section */}
      <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: 3 }}>
        <Box>
          <Typography fontWeight="900" sx={{ fontSize: isExtraSmall ? '1.75rem' : isMobile ? '2.25rem' : '3.25rem', letterSpacing: '-0.03em', lineHeight: 1.1, color: theme.palette.text.primary, mb: 1 }}>
            User Management
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, opacity: 0.9 }}>
            Management of institutional personnel records and system access.
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, width: isMobile ? '100%' : 'auto' }}>
           <Paper elevation={0} sx={{ p: isMobile ? 1.5 : 2.5, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, textAlign: 'center', flex: 1, minWidth: '120px' }}>
              <Typography variant="h5" fontWeight="800" color="primary">{users.length}</Typography>
              <Typography variant="caption" fontWeight="800" color="text.secondary">RECORDED</Typography>
           </Paper>
           <Paper elevation={0} sx={{ p: isMobile ? 1.5 : 2.5, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, textAlign: 'center', flex: 1, minWidth: '120px' }}>
              <Typography variant="h5" fontWeight="800" sx={{ color: COLORS.pending }}>{users.filter(u=>!u.is_approved).length}</Typography>
              <Typography variant="caption" fontWeight="800" color="text.secondary">PENDING</Typography>
           </Paper>
        </Box>
      </Box>

      {/* Filter Bar (Standardized Architecture) */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, display: 'flex', flexDirection: isExtraSmall ? 'column' : 'row', gap: 2, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, borderRight: isExtraSmall ? 'none' : `1px solid ${theme.palette.divider}`, pr: 2, minWidth: isExtraSmall ? '100%' : '300px' }}>
            <Search size={18} color={theme.palette.text.secondary} />
            <TextField 
                variant="standard" placeholder="Search by name or system email..." fullWidth 
                InputProps={{ disableUnderline: true, style: { fontWeight: 600 } }}
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, width: isExtraSmall ? '100%' : '450px' }}>
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel>Status</InputLabel>
                <Select value={viewMode} label="Status" onChange={(e) => setViewMode(e.target.value as any)} sx={{ borderRadius: '12px' }}>
                   <MenuItem value="all">All Personnel</MenuItem>
                   <MenuItem value="pending">Review Required</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel>Designation</InputLabel>
                <Select value={roleFilter} label="Designation" onChange={(e) => setRoleFilter(e.target.value)} sx={{ borderRadius: '12px' }}>
                   {['All', 'Admin', 'Security', 'Faculty', 'Student'].map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                </Select>
              </FormControl>
          </Box>
          <Button 
            variant={selectionMode ? "contained" : "outlined"}
            onClick={() => { setSelectionMode(!selectionMode); if(selectionMode) setSelectedIds([]); }}
            sx={{ borderRadius: '12px', height: '40px', fontWeight: 800, textTransform: 'none', px: 3, flexShrink: 0 }}
          >
            {selectionMode ? 'Cancel Selection' : 'Batch Actions'}
          </Button>
      </Paper>

      {/* High-Density Personnel List */}
      <Box sx={{ flex: 1 }}>
        {loading ? (
             <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}><CircularProgress thickness={4} size={50} /></Box>
        ) : filteredUsers.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 15, opacity: 0.4 }}>
                <Typography variant="h6" fontWeight="700">No matching personnel records found</Typography>
            </Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: isMobile ? 2 : 3 }}>
            {filteredUsers
              .slice((page - 1) * itemsPerPage, page * itemsPerPage)
              .map((user) => {
                const isSelected = selectedIds.includes(user.id);
                const displayRole = user.role || (user.roles?.[0]?.roles?.name) || 'Student';
                const isPending = user.is_approved === false;
                
                return (
                <Fade in={true} key={user.id}>
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: isMobile ? 2.5 : 3.5, borderRadius: '16px', 
                        border: `1px solid ${isSelected ? COLORS.primary : theme.palette.divider}`,
                        bgcolor: isSelected ? `${COLORS.primary}05` : theme.palette.background.paper,
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        '&:hover': { borderColor: COLORS.primary, boxShadow: theme.shadows[2] }
                      }}
                    >
                      {selectionMode && (
                         <Checkbox checked={isSelected} sx={{ position: 'absolute', top: 12, right: 12 }} onChange={() => setSelectedIds(p=>p.includes(user.id)?p.filter(i=>i!==user.id):[...p,user.id])} />
                      )}

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar src={user.avatar_url || ''} sx={{ width: 56, height: 56, border: `1px solid ${theme.palette.divider}`, fontWeight: 800 }}>{user.full_name?.[0]}</Avatar>
                            <Box sx={{ minWidth: 0 }}>
                                <Typography variant="subtitle1" fontWeight="800" sx={{ lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.full_name}</Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</Typography>
                            </Box>
                        </Box>

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            <Chip label={displayRole.toUpperCase()} size="small" sx={{ fontWeight: 900, fontSize: '0.6rem', bgcolor: `${COLORS.primary}12`, color: COLORS.primary }} />
                            {isPending && <Chip label="REVIEW" size="small" sx={{ fontWeight: 900, fontSize: '0.6rem', bgcolor: `${COLORS.pending}12`, color: COLORS.pending }} />}
                        </Box>

                        <Divider sx={{ opacity: 0.5 }} />

                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                             <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem' }}>Department</Typography>
                                <Typography variant="body2" fontWeight="700" sx={{ fontSize: '0.85rem' }}>{user.department || '--'}</Typography>
                             </Box>
                             <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem' }}>Enrolled</Typography>
                                <Typography variant="body2" fontWeight="700" sx={{ fontSize: '0.85rem' }}>{new Date(user.created_at).toLocaleDateString()}</Typography>
                             </Box>
                        </Box>

                        {!selectionMode && (
                          <Stack direction="row" spacing={1.5} sx={{ mt: 1 }}>
                             {isPending ? (
                                 <Button fullWidth variant="contained" color="success" size="small" onClick={()=>handleApprove(user.id)} sx={{ borderRadius: '10px', fontWeight: 800, textTransform: 'none' }}>Grant Access</Button>
                             ) : (
                                 <Button fullWidth variant="outlined" size="small" onClick={()=>{ setSelectedUser(user); setIsViewOpen(true); }} sx={{ borderRadius: '10px', fontWeight: 800, textTransform: 'none', border: `1.5px solid ${theme.palette.divider}` }}>View Details</Button>
                             )}
                             <IconButton onClick={()=>handleEdit(user)} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '10px', p: 1 }}>
                                <Edit2 size={16} />
                             </IconButton>
                          </Stack>
                        )}
                      </Box>
                    </Paper>
                </Fade>
                );
              })
            }
          </Box>
        )}
      </Box>

      {/* Pagination (Modernized) */}
      {!loading && filteredUsers.length > itemsPerPage && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <Pagination count={Math.ceil(filteredUsers.length / itemsPerPage)} page={page} onChange={(_, v) => setPage(v)} color="primary" sx={{ '& .MuiPaginationItem-root': { fontWeight: 800, borderRadius: '8px' } }} />
        </Box>
      )}

      {/* Floating Batch Control */}
      {selectedIds.length > 0 && (
          <Box sx={{ position: 'fixed', bottom: 40, left: '50%', transform: 'translateX(-50%)', zIndex: 1200, px: 2, width: isMobile ? '100%' : 'auto' }}>
            <Paper elevation={12} sx={{ p: 1, borderRadius: '32px', bgcolor: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', gap: isMobile ? 1.5 : 4, px: 2.5 }}>
               <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ bgcolor: COLORS.primary, width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>{selectedIds.length}</Box>
                  {!isMobile && <Typography variant="body2" fontWeight="800">Personnel Selected</Typography>}
               </Box>
               <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
               <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="contained" color="success" size="small" onClick={handleApproveAll} sx={{ borderRadius: '24px', fontWeight: 900, px: 2, textTransform: 'none' }}>Approve</Button>
                  <Button variant="contained" onClick={(e)=>setBulkRoleAnchor(e.currentTarget)} sx={{ borderRadius: '24px', fontWeight: 900, px: 2, bgcolor: COLORS.primary, textTransform: 'none' }}>Designation</Button>
                  <IconButton size="small" onClick={()=>setSelectedIds([])} sx={{ color: 'rgba(255,255,255,0.4)' }}><RefreshCcw size={16} /></IconButton>
               </Box>
            </Paper>
            <Select open={Boolean(bulkRoleAnchor)} onClose={()=>setBulkRoleAnchor(null)} value="" sx={{ display: 'none' }} MenuProps={{ anchorEl: bulkRoleAnchor }}>
               {['student', 'faculty', 'security', 'admin'].map(r => <MenuItem key={r} onClick={()=>handleBatchRoleChange(r)} sx={{ fontWeight: 700 }}>Set as {r.toUpperCase()}</MenuItem>)}
            </Select>
          </Box>
      )}

      {/* Personnel Profile Dialog */}
      <Dialog open={isViewOpen} onClose={()=>setIsViewOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '20px' } }}>
        <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
           {selectedUser && (
             <Stack alignItems="center" spacing={2}>
               <Avatar src={selectedUser.avatar_url||''} sx={{ width: 80, height: 80, border: `3px solid ${COLORS.primary}20` }}>{selectedUser.full_name?.[0]}</Avatar>
               <Box>
                 <Typography variant="h6" fontWeight="900">{selectedUser.full_name}</Typography>
                 <Typography variant="body2" color="text.secondary" fontWeight={600}>{selectedUser.email}</Typography>
               </Box>
             </Stack>
           )}
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
             <Stack spacing={2.5} sx={{ mt: 2 }}>
               <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" fontWeight="800" color="text.secondary">DESIGNATION</Typography>
                  <Chip label={(selectedUser.role||'user').toUpperCase()} size="small" sx={{ fontWeight: 800, fontSize: '0.65rem' }} />
               </Box>
               <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" fontWeight="800" color="text.secondary">DEPARTMENT</Typography>
                  <Typography variant="body2" fontWeight="800">{selectedUser.department||'Unassigned'}</Typography>
               </Box>
               <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" fontWeight="800" color="text.secondary">ENROLLED</Typography>
                  <Typography variant="body2" fontWeight="800">{new Date(selectedUser.created_at).toLocaleDateString()}</Typography>
               </Box>
             </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}><Button onClick={()=>setIsViewOpen(false)} fullWidth variant="contained" color="inherit" sx={{ borderRadius: '12px', fontWeight: 800, bgcolor: 'rgba(0,0,0,0.05)' }}>Close Profile</Button></DialogActions>
      </Dialog>

      {/* Edit Access Dialog */}
      <Dialog open={isEditOpen} onClose={()=>setIsEditOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '20px' } }}>
        <DialogTitle sx={{ fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 3 }}>
           Update Access Level
           <IconButton onClick={()=>setIsEditOpen(false)} size="small"><X size={20}/></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, pt: 1 }}>
          <Stack spacing={3}>
            <Box>
               <Typography variant="caption" fontWeight="800" color="text.secondary" sx={{ ml: 1, mb: 1, display: 'block' }}>ASSIGN DESIGNATION</Typography>
               <TextField select fullWidth value={editForm.role} onChange={e=>setEditForm(p=>({...p, role: e.target.value}))} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', fontWeight: 700 } }}>
                  {['student', 'faculty', 'security', 'admin'].map(r => <MenuItem key={r} value={r} sx={{ fontWeight: 700 }}>{r.toUpperCase()}</MenuItem>)}
               </TextField>
            </Box>
            <Box>
               <Typography variant="caption" fontWeight="800" color="text.secondary" sx={{ ml: 1, mb: 1, display: 'block' }}>DEPARTMENT AFFILIATION</Typography>
               <TextField fullWidth value={editForm.department} onChange={e=>setEditForm(p=>({...p, department: e.target.value}))} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', fontWeight: 700 } }} />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleUpdateUser} fullWidth variant="contained" size="large" sx={{ borderRadius: '12px', py: 1.5, fontWeight: 900, textTransform: 'none' }}>Refine Access Controls</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagementPage;
