import React, { useEffect, useState } from 'react';
import { DataGrid, GridColDef, GridToolbar, GridRenderCellParams } from '@mui/x-data-grid';
import { Box, Typography, Paper, Chip, Avatar, Tooltip } from '@mui/material';
import { Eye, Edit2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { api } from '@services/api';
import ErrorBoundary from '@shared/components/ErrorBoundary';

// Define strict interfaces matching backend response
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
  roles?: Role[]; // Optional because it comes from a manual merge
}

const UserManagementPage: React.FC = () => {
    return (
        <ErrorBoundary>
            <UserManagementPageContent />
        </ErrorBoundary>
    );
}

const UserManagementPageContent: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await api.fetchUsers();
      // console.log('Users API Response:', data); // Debugging
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

  const columns: GridColDef[] = [
    { 
      field: 'avatar_url', 
      headerName: 'Avatar', 
      width: 70,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" alignItems="center" height="100%">
            <Avatar 
                src={params.value as string || undefined} 
                alt={params.row.full_name || 'User'} 
                sx={{ width: 32, height: 32 }} 
            />
        </Box>
      )
    },
    { field: 'full_name', headerName: 'Full Name', flex: 1, minWidth: 150 },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 200 },
    { 
      field: 'roles', 
      headerName: 'Role', 
      width: 200,
      renderCell: (params: GridRenderCellParams) => {
        const userRoles = params.value as Role[] | undefined;
        
        if (!userRoles || !Array.isArray(userRoles) || userRoles.length === 0) {
            return <Chip label="Student" size="small" variant="outlined" color="default" />;
        }

        return (
          <Box display="flex" gap={0.5} overflow="hidden" alignItems="center" height="100%">
            {userRoles.map((r, idx) => (
              <Chip 
                key={idx} 
                label={r.roles?.name || 'Unknown'} 
                size="small" 
                color="primary" 
                variant="outlined" 
              />
            ))}
          </Box>
        );
      }
    },
    { field: 'department', headerName: 'Department', width: 150 },
    { 
      field: 'created_at', 
      headerName: 'Joined', 
      width: 150,
      valueFormatter: (value: any) => {
          if (!value) return '-';
          return new Date(value).toLocaleDateString();
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (_params: GridRenderCellParams) => (
         <Box display="flex" gap={1} alignItems="center" height="100%">
            <Tooltip title="View Details">
              <Eye size={18} style={{ cursor: 'pointer', color: '#666' }} />
            </Tooltip>
             <Tooltip title="Edit User">
              <Edit2 size={18} style={{ cursor: 'pointer', color: '#1976d2' }} />
            </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3, height: '85vh', display: 'flex', flexDirection: 'column' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="600" color="text.primary">
          User Management
        </Typography>
      </Box>

      <Paper sx={{ flex: 1, width: '100%', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        <DataGrid
          rows={users}
          columns={columns}
          loading={loading}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          slots={{ toolbar: GridToolbar }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
              quickFilterProps: { debounceMs: 500 },
            },
          }}
          sx={{
            border: 'none',
            '& .MuiDataGrid-cell:focus': { outline: 'none' },
          }}
        />
      </Paper>
    </Box>
  );
};

export default UserManagementPage;
