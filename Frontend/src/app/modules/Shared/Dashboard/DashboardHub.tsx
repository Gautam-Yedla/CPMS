import React from 'react';
import { useSelector } from 'react-redux';
import { IRootState } from '@app/appReducer';
import { Box, Typography } from '@mui/material';

interface DashboardHubProps {
  title: string;
  subtitle?: string;
  widgets: React.ReactNode[];
}

/**
 * DashboardHub: A generic container for dashboard widgets.
 * Items passed as 'widgets' should ideally be wrapped in PermissionGuard if they are sensitive.
 */
const DashboardHub: React.FC<DashboardHubProps> = ({ title, subtitle, widgets }) => {
  const { user } = useSelector((state: IRootState) => state.app.auth);

  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      <header style={{ marginBottom: '2rem' }}>
        <Typography variant="h4" fontWeight={700} color="text.primary" gutterBottom>
            {title.replace('{name}', user?.full_name.split(' ')[0] || '')}
        </Typography>
        {subtitle && (
            <Typography variant="body1" color="text.secondary">
                {subtitle}
            </Typography>
        )}
      </header>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
        gap: '2rem' 
      }}>
        {widgets.map((widget, index) => (
          <div key={index}>
            {widget}
          </div>
        ))}
      </div>
    </Box>
  );
};

export default DashboardHub;
