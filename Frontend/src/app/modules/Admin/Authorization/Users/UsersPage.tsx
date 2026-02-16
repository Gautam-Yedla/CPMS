
import React, { useEffect, useState } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemText
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Search, UserCog } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

interface UserProfile {
  id: string;
  full_name: string;
  email: string; // Note: profiles table might not have email if it's in auth.users, but we'll assume join or view
  department: string;
  roles?: Role[];
}

interface Role {
  id: string;
  name: string;
}

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const [usersRes, rolesRes] = await Promise.all([
        axios.get('http://localhost:3001/api/auth/users', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:3001/api/auth/roles', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      // For each user, we might need to fetch their roles if not included
      // Optimally backend should return this, but for now let's fetch individual user roles when opening modal
      // or assume the users endpoint returns it. 
      // The current backend implementation of getAllUsers just returns profiles.
      // So we will fetch user roles on demand or modify backend. 
      // For this MVP, let's keep it simple and just show users.
      
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = async (user: UserProfile) => {
    setSelectedUser(user);
    try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:3001/api/auth/users/${user.id}/roles`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setSelectedRoleIds(res.data.map((r: Role) => r.id));
        setModalOpen(true);
    } catch (error) {
        toast.error('Failed to fetch user roles');
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedUser(null);
    setSelectedRoleIds([]);
  };

  const handleSaveRoles = async () => {
    if (!selectedUser) return;
    try {
      const token = localStorage.getItem('token');
      // This is a bit complex CRUD. Ideally backend handles bulk update.
      // We will loop for now or assume backend has a setRoles endpoint.
      // The current backend has assignRole and removeRole.
      // Implementing a smart diff in frontend for now.
      
      const currentRolesRes = await axios.get(`http://localhost:3001/api/auth/users/${selectedUser.id}/roles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const currentRoleIds = currentRolesRes.data.map((r: Role) => r.id);

      const toAdd = selectedRoleIds.filter(id => !currentRoleIds.includes(id));
      const toRemove = currentRoleIds.filter((id: string) => !selectedRoleIds.includes(id));

      await Promise.all([
        ...toAdd.map(roleId => axios.post(`http://localhost:3001/api/auth/users/${selectedUser.id}/roles`, { roleId }, { headers: { Authorization: `Bearer ${token}` } })),
        ...toRemove.map((roleId: string) => axios.delete(`http://localhost:3001/api/auth/users/${selectedUser.id}/roles/${roleId}`, { headers: { Authorization: `Bearer ${token}` } }))
      ]);

      toast.success('Roles updated successfully');
      handleCloseModal();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update roles');
    }
  };

  const columns: GridColDef[] = [
    { field: 'full_name', headerName: 'Full Name', flex: 1 },
    { field: 'department', headerName: 'Department', flex: 1 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params: any) => (
        <Button
            size="small"
            startIcon={<UserCog size={16} />}
            onClick={() => handleOpenModal(params.row)}
        >
            Manage Roles
        </Button>
      ),
    },
  ];

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <div>
          <Typography variant="h4" fontWeight="bold">Users</Typography>
          <Typography variant="body2" color="text.secondary">Assign roles to users</Typography>
        </div>
      </Box>

      <Paper elevation={0} sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Search size={20} color="gray" />
        <TextField 
          variant="standard" 
          placeholder="Search users..." 
          fullWidth 
          InputProps={{ disableUnderline: true }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Paper>

      <Paper elevation={0} sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={filteredUsers}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
        />
      </Paper>

      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>Manage Roles for {selectedUser?.full_name}</DialogTitle>
        <DialogContent>
            <Box mt={2}>
              <FormControl sx={{ width: '100%' }}>
                <InputLabel>Roles</InputLabel>
                <Select
                  multiple
                  value={selectedRoleIds}
                  onChange={(e) => setSelectedRoleIds(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                  input={<OutlinedInput label="Roles" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={roles.find(r => r.id === value)?.name} />
                      ))}
                    </Box>
                  )}
                >
                  {roles.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      <Checkbox checked={selectedRoleIds.indexOf(role.id) > -1} />
                      <ListItemText primary={role.name} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveRoles}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsersPage;
