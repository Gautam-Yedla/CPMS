import React from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';
import { Car, User } from 'lucide-react';
import { useSelector } from 'react-redux';
import { IRootState } from '@app/appReducer';

const QuickProfileWidget: React.FC = () => {
  const theme = useTheme();
  const { user } = useSelector((state: IRootState) => state.app.auth);

  return (
    <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: '16px', border: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="h6" fontWeight={700} mb={2}>Priority Status</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
           <User size={40} color={theme.palette.primary.main} />
           <Box>
                <Typography variant="body1" fontWeight={700}>{user?.full_name}</Typography>
                <Typography variant="caption" color="text.secondary">{user?.role?.toUpperCase()} MEMBER • {user?.department}</Typography>
           </Box>
        </Box>
        <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: '12px', display: 'flex', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Car size={18} />
                <Typography variant="body2">Assigned Vehicle</Typography>
            </Box>
            <Typography variant="body2" fontWeight={700}>{user?.vehicle_number || 'N/A'}</Typography>
        </Box>
    </Box>
  );
};

export default QuickProfileWidget;
