import React, { useEffect, useState } from 'react';
import { DataGrid, GridColDef, GridToolbar, GridRenderCellParams } from '@mui/x-data-grid';
import { Box, Typography, Paper, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { Plus, MessageSquare } from 'lucide-react';
import { toast } from 'react-toastify';
import { api } from '@services/api';
import ErrorBoundary from '@shared/components/ErrorBoundary';

interface UserProfile {
    full_name: string;
    email: string;
}

interface Ticket {
  id: string; // Ensure this matches backend UUID
  subject: string;
  message: string;
  status: 'open' | 'pending' | 'closed';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  profiles?: UserProfile | null;
}

const SupportTicketsPageContent: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  
  // New Ticket State
  const [newTicket, setNewTicket] = useState({ subject: '', message: '', priority: 'medium' });

  // View/Edit Ticket State
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await api.fetchTickets();
      console.log('Support Tickets API Response:', data); // Debugging

      if (Array.isArray(data)) {
          setTickets(data);
      } else {
          console.error('API did not return an array:', data);
          setTickets([]);
          toast.error('Received invalid data from server');
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Failed to load tickets');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreateTicket = async () => {
    try {
      if (!newTicket.subject.trim() || !newTicket.message.trim()) {
        toast.warning('Please fill in all fields');
        return;
      }
      
      await api.createTicket(newTicket);
      toast.success('Ticket created successfully');
      setOpenDialog(false);
      setNewTicket({ subject: '', message: '', priority: 'medium' });
      fetchTickets();
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to create ticket');
    }
  };

  const handleUpdateStatus = async (status: string) => {
      if (!selectedTicket) return;
      try {
          await api.updateTicket(selectedTicket.id, { status });
          toast.success('Status updated');
          fetchTickets();
          setViewDialogOpen(false);
      } catch (error) {
          toast.error('Failed to update status');
      }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'success';
      case 'pending': return 'warning';
      case 'closed': return 'default';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
      switch (priority) {
          case 'high': return 'error';
          case 'medium': return 'info';
          case 'low': return 'success';
          default: return 'default';
      }
  };

  const columns: GridColDef[] = [
    { field: 'subject', headerName: 'Subject', flex: 1, minWidth: 200 },
    { field: 'category', headerName: 'Category', width: 140 }, // Added category column
    { 
        field: 'profiles', 
        headerName: 'User', 
        width: 180,
        valueGetter: (value: any, row: Ticket) => {
            return row?.profiles?.full_name || 'Unknown';
        }
    },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip 
            label={params.value as string} 
            color={getStatusColor(params.value as string) as any} 
            size="small" 
            variant="outlined" 
            sx={{ textTransform: 'capitalize' }}
        />
      )
    },
    { 
      field: 'priority', 
      headerName: 'Priority', 
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip 
            label={params.value as string} 
            color={getPriorityColor(params.value as string) as any} 
            size="small" 
            sx={{ textTransform: 'capitalize' }}
        />
      )
    },
    { 
      field: 'created_at', 
      headerName: 'Created At', 
      width: 180,
      valueFormatter: (value: any) => {
          if (!value) return '-';
          try {
             return new Date(value).toLocaleString();
          } catch (e) {
             return 'Invalid Date';
          }
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
         <Button 
            startIcon={<MessageSquare size={16} />} 
            size="small" 
            onClick={() => { setSelectedTicket(params.row); setViewDialogOpen(true); }}
         >
             View
         </Button>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3, height: '85vh', display: 'flex', flexDirection: 'column' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="600" color="text.primary">
          Support Tickets
        </Typography>
        <Button variant="contained" startIcon={<Plus />} onClick={() => setOpenDialog(true)}>
          New Ticket
        </Button>
      </Box>

      <Paper sx={{ flex: 1, width: '100%', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        <DataGrid
          rows={tickets}
          columns={columns}
          loading={loading}
          // IMPORTANT: Explicitly use id property
          getRowId={(row) => row.id} 
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
            sorting: { sortModel: [{ field: 'created_at', sort: 'desc' }] }
          }}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          slots={{ toolbar: GridToolbar }}
          sx={{
            border: 'none',
            '& .MuiDataGrid-cell:focus': { outline: 'none' },
          }}
        />
      </Paper>

      {/* Create Ticket Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Support Ticket</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Subject"
              fullWidth
              value={newTicket.subject}
              onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
            />
             <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                    value={newTicket.priority}
                    label="Priority"
                    onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                </Select>
            </FormControl>
            <TextField
              label="Message"
              fullWidth
              multiline
              rows={4}
              value={newTicket.message}
              onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateTicket} disabled={!newTicket.subject || !newTicket.message}>
            Submit Ticket
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Ticket Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
          {selectedTicket && (
              <>
                <DialogTitle>
                    {selectedTicket.subject}
                    <Typography variant="subtitle2" color="text.secondary">
                        Ticket ID: {selectedTicket.id}
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mb: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                        <Box display="flex" gap={1} mb={1}>
                             <Chip label={selectedTicket.priority} color={getPriorityColor(selectedTicket.priority) as any} size="small" />
                             <Chip label={selectedTicket.status} color={getStatusColor(selectedTicket.status) as any} size="small" />
                        </Box>
                        <Typography variant="body1">{selectedTicket.message}</Typography>
                        <Typography variant="caption" display="block" mt={1} color="text.secondary">
                             By: {selectedTicket.profiles?.full_name || 'Unknown'} on {new Date(selectedTicket.created_at).toLocaleString()}
                        </Typography>
                    </Box>
                    
                    {/* Admin Actions */}
                    <Typography variant="h6" gutterBottom>Actions</Typography>
                    <Box display="flex" gap={2}>
                        <Button variant="outlined" color="success" onClick={() => handleUpdateStatus('open')}>Mark Open</Button>
                        <Button variant="outlined" color="warning" onClick={() => handleUpdateStatus('pending')}>Mark Pending</Button>
                        <Button variant="outlined" color="error" onClick={() => handleUpdateStatus('closed')}>Close Ticket</Button>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
                </DialogActions>
              </>
          )}
      </Dialog>
    </Box>
  );
};

const SupportTicketsPage: React.FC = () => {
    return (
        <ErrorBoundary>
            <SupportTicketsPageContent />
        </ErrorBoundary>
    );
};

export default SupportTicketsPage;
