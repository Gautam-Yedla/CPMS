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
  TextField
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

interface Role {
  id: string;
  name: string;
  description: string;
  is_system: boolean;
}

const RolesPage: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token'); // Simplistic token retrieval
      const response = await axios.get('http://localhost:3001/api/auth/roles', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRoles(response.data);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
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
      const token = localStorage.getItem('token');
      if (editingRole) {
        await axios.put(`http://localhost:3001/api/auth/roles/${editingRole.id}`, formData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Role updated successfully');
      } else {
        await axios.post('http://localhost:3001/api/auth/roles', formData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Role created successfully');
      }
      fetchRoles();
      handleCloseModal();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this role?')) return;
    try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:3001/api/auth/roles/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
      toast.success('Role deleted successfully');
      fetchRoles();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete role');
    }
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Role Name', flex: 1 },
    { field: 'description', headerName: 'Description', flex: 2 },
    { 
      field: 'is_system', 
      headerName: 'Type', 
      width: 120,
      renderCell: (params) => (
        <span style={{ 
          padding: '4px 8px', 
          borderRadius: '4px', 
          backgroundColor: params.value ? 'rgba(0, 0, 0, 0.05)' : 'rgba(59, 130, 246, 0.1)',
          color: params.value ? 'inherit' : '#3b82f6',
          fontSize: '0.75rem',
          fontWeight: 600
        }}>
          {params.value ? 'System' : 'Custom'}
        </span>
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box display="flex" gap={1}>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => handleOpenModal(params.row)}>
              <Edit2 size={16} />
            </IconButton>
          </Tooltip>
          {!params.row.is_system && (
            <Tooltip title="Delete">
              <IconButton size="small" color="error" onClick={() => handleDelete(params.row.id)}>
                <Trash2 size={16} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <div>
          <Typography variant="h4" fontWeight="bold">Roles</Typography>
          <Typography variant="body2" color="text.secondary">Manage user roles and access levels</Typography>
        </div>
        <Button 
          variant="contained" 
          startIcon={<Plus size={18} />}
          onClick={() => handleOpenModal()}
        >
          Create Role
        </Button>
      </Box>

      <Paper elevation={0} sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Search size={20} color="gray" />
        <TextField 
          variant="standard" 
          placeholder="Search roles..." 
          fullWidth 
          InputProps={{ disableUnderline: true }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Paper>

      <Paper elevation={0} sx={{ height: 500, width: '100%' }}>
        <DataGrid
          rows={filteredRoles}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
        />
      </Paper>

      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>{editingRole ? 'Edit Role' : 'Create New Role'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Role Name"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={!formData.name}>
            {editingRole ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RolesPage;
