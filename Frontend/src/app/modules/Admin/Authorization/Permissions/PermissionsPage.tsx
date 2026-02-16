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
  Chip
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Plus, Search } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

interface Permission {
  id: string;
  name: string;
  module: string;
  description: string;
  scope: string;
}

const PermissionsPage: React.FC = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', module: '', description: '', scope: 'global' });

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/api/auth/permissions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPermissions(response.data);
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
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:3001/api/auth/permissions', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Permission created successfully');
      fetchPermissions();
      handleCloseModal();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Operation failed');
    }
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Permission Name', flex: 1.5 },
    { 
      field: 'module', 
      headerName: 'Module', 
      width: 150,
      renderCell: (params: any) => (
        <Chip label={params.value} size="small" variant="outlined" />
      )
    },
    { field: 'description', headerName: 'Description', flex: 2 },
    { field: 'scope', headerName: 'Scope', width: 120 },
  ];

  const filteredPermissions = permissions.filter(perm => 
    perm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    perm.module.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <div>
          <Typography variant="h4" fontWeight="bold">Permissions</Typography>
          <Typography variant="body2" color="text.secondary">Define system capabilities and access scopes</Typography>
        </div>
        <Button 
          variant="contained" 
          startIcon={<Plus size={18} />}
          onClick={handleOpenModal}
        >
          Create Permission
        </Button>
      </Box>

      <Paper elevation={0} sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Search size={20} color="gray" />
        <TextField 
          variant="standard" 
          placeholder="Search permissions..." 
          fullWidth 
          InputProps={{ disableUnderline: true }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Paper>

      <Paper elevation={0} sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={filteredPermissions}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          initialState={{
            sorting: {
              sortModel: [{ field: 'module', sort: 'asc' }],
            },
          }}
        />
      </Paper>

      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Permission</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Permission Name (e.g., users.create)"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              helperText="Use dot notation format"
            />
            <TextField
              label="Module"
              fullWidth
              value={formData.module}
              onChange={(e) => setFormData({ ...formData, module: e.target.value })}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <TextField
                label="Scope"
                fullWidth
                value={formData.scope}
                onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={!formData.name || !formData.module}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PermissionsPage;
