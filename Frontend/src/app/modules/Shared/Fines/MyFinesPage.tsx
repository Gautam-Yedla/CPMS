import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Button, Chip, CircularProgress } from '@mui/material';
import { api } from '@app/utils/services/api';
import toast from 'react-hot-toast';
import { CreditCard, CheckCircle } from 'lucide-react';

interface Violation {
  id: string;
  amount: number;
  status: string;
  violation_date: string;
  violation_type: string;
  description: string;
}

const MyFinesPage: React.FC = () => {
  const [fines, setFines] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);

  const fetchFines = async () => {
    try {
      setLoading(true);
      const data = await api.fetchMyViolations();
      setFines(data);
    } catch (error) {
      console.error('Error fetching fines:', error);
      toast.error('Failed to load fines');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFines();
  }, []);

  const handlePay = async (id: string) => {
    try {
      setPayingId(id);
      await api.payViolation(id);
      toast.success('Payment successful!');
      fetchFines(); // refresh
    } catch (error: any) {
      console.error('Error paying fine:', error);
      toast.error(error.message || 'Payment failed');
    } finally {
      setPayingId(null);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
        <CircularProgress />
      </Box>
    );
  }

  const unpaidFines = fines.filter(f => f.status === 'Unpaid');
  const paidFines = fines.filter(f => f.status === 'Paid');

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight={700} mb={1}>My Fines</Typography>
      <Typography color="text.secondary" mb={4}>View and pay your parking violations and fines.</Typography>

      <Typography variant="h6" fontWeight={600} mb={2}>Unpaid Fines</Typography>
      {unpaidFines.length === 0 ? (
        <Typography color="text.secondary" mb={4}>You have no unpaid fines. Great job!</Typography>
      ) : (
        <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={3} mb={4}>
          {unpaidFines.map(fine => (
            <Box key={fine.id}>
              <Card variant="outlined" sx={{ borderRadius: 2, borderColor: 'error.main' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box>
                      <Typography variant="h6" color="error.main" fontWeight={600}>${fine.amount}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(fine.violation_date).toLocaleString()}
                      </Typography>
                    </Box>
                    <Chip label="Unpaid" color="error" size="small" />
                  </Box>
                  <Typography variant="subtitle1" fontWeight={600}>{fine.violation_type}</Typography>
                  <Typography variant="body2" color="text.secondary" mb={3}>
                    {fine.description || 'No additional description provided.'}
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    fullWidth 
                    startIcon={payingId === fine.id ? <CircularProgress size={20} color="inherit" /> : <CreditCard size={18} />}
                    onClick={() => handlePay(fine.id)}
                    disabled={payingId === fine.id}
                  >
                    Pay Now
                  </Button>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      )}

      <Typography variant="h6" fontWeight={600} mb={2}>Payment History</Typography>
      {paidFines.length === 0 ? (
        <Typography color="text.secondary">No payment history.</Typography>
      ) : (
        <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={3}>
          {paidFines.map(fine => (
            <Box key={fine.id}>
              <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: 'background.default' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box>
                      <Typography variant="h6" color="text.secondary" fontWeight={600}>${fine.amount}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(fine.violation_date).toLocaleString()}
                      </Typography>
                    </Box>
                    <Chip label="Paid" color="success" size="small" icon={<CheckCircle size={14} />} />
                  </Box>
                  <Typography variant="subtitle1" fontWeight={600} color="text.secondary">{fine.violation_type}</Typography>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default MyFinesPage;
