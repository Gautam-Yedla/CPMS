import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Button, TextField, MenuItem, CircularProgress } from '@mui/material';
import { api } from '@app/utils/services/api';
import toast from 'react-hot-toast';
import { CheckCircle, Search } from 'lucide-react';

interface Violation {
  id: string;
  amount: number;
  status: string;
  violation_date: string;
  violation_type: string;
  description: string;
  users?: {
    full_name: string;
    email: string;
  };
}

const AdminFinesPage: React.FC = () => {
  const [fines, setFines] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [markingId, setMarkingId] = useState<string | null>(null);

  const fetchFines = async () => {
    try {
      setLoading(true);
      // Re-using fetchViolations since we updated the backend to return user info
      const data = await api.fetchViolations();
      setFines(data);
    } catch (error) {
      console.error('Error fetching fines:', error);
      toast.error('Failed to load fines data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFines();
  }, []);

  const handleMarkPaid = async (id: string) => {
    try {
      setMarkingId(id);
      // Simulate admin marking fine as paid
      await api.payViolation(id);
      toast.success('Fine marked as paid');
      fetchFines();
    } catch (error: any) {
      console.error('Error marking fine paid:', error);
      toast.error(error.message || 'Failed to update fine status');
    } finally {
      setMarkingId(null);
    }
  };

  const filteredFines = useMemo(() => {
    return fines.filter(fine => {
      const matchesStatus = statusFilter === 'All' || fine.status === statusFilter;
      const userName = fine.users?.full_name?.toLowerCase() || '';
      const userEmail = fine.users?.email?.toLowerCase() || '';
      const matchesSearch = userName.includes(searchTerm.toLowerCase()) || 
                            userEmail.includes(searchTerm.toLowerCase()) ||
                            fine.violation_type.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [fines, statusFilter, searchTerm]);

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={700} mb={1}>Fines Management</Typography>
          <Typography color="text.secondary">Overview of all system fines and payments</Typography>
        </Box>
      </Box>

      <Card variant="outlined" sx={{ mb: 4, p: 2, borderRadius: 2 }}>
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            size="small"
            placeholder="Search by name, email, or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <Search size={20} style={{ marginRight: 8, color: '#888' }} />
            }}
            sx={{ flexGrow: 1 }}
          />
          <TextField
            select
            size="small"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="All">All Statuses</MenuItem>
            <MenuItem value="Unpaid">Unpaid</MenuItem>
            <MenuItem value="Paid">Paid</MenuItem>
          </TextField>
        </Box>
      </Card>

      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell><strong>User</strong></TableCell>
              <TableCell><strong>Type</strong></TableCell>
              <TableCell><strong>Date</strong></TableCell>
              <TableCell><strong>Amount</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredFines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                  <Typography color="text.secondary">No fines found matching your criteria.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredFines.map(fine => (
                <TableRow key={fine.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{fine.users?.full_name || 'Unknown User'}</Typography>
                    <Typography variant="caption" color="text.secondary">{fine.users?.email}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{fine.violation_type}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(fine.violation_date).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} color={fine.status === 'Unpaid' ? 'error.main' : 'text.primary'}>
                      ${fine.amount}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={fine.status} 
                      size="small" 
                      color={fine.status === 'Paid' ? 'success' : 'error'}
                      variant={fine.status === 'Paid' ? 'outlined' : 'filled'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    {fine.status === 'Unpaid' && (
                      <Button 
                        size="small" 
                        variant="outlined" 
                        color="success"
                        startIcon={markingId === fine.id ? <CircularProgress size={14} color="inherit" /> : <CheckCircle size={14} />}
                        onClick={() => handleMarkPaid(fine.id)}
                        disabled={markingId === fine.id}
                      >
                        Mark Paid
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AdminFinesPage;
