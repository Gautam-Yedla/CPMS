import { useState } from 'react';
import { Box, Typography, Paper, useTheme, Button, Avatar, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, Snackbar, Alert } from '@mui/material';
import { Download, Filter, TrendingUp, Users, ShieldAlert, Car, Calendar } from 'lucide-react';

const MOCK_REPORTS = [
  { id: 1, title: 'Weekly Access Log Summary', type: 'Access', date: 'Oct 24, 2023', downloads: 14, icon: <Users size={20} /> },
  { id: 2, title: 'October Violation Audit', type: 'Violations', date: 'Oct 01, 2023', downloads: 8, icon: <ShieldAlert size={20} /> },
  { id: 3, title: 'Campus Parking Occupancy', type: 'Parking', date: 'Sep 28, 2023', downloads: 32, icon: <Car size={20} /> },
  { id: 4, title: 'System Uptime & Stability', type: 'System', date: 'Sep 15, 2023', downloads: 5, icon: <TrendingUp size={20} /> },
];

export default function ReportsPage() {
  const theme = useTheme();
  const [filterOpen, setFilterOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // Mock CSV Download function
  const handleDownload = (filename: string) => {
    const csvContent = "data:text/csv;charset=utf-8,ID,Name,Value\n1,Test Data A,100\n2,Test Data B,200\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename.toLowerCase().replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box p={2} minHeight="calc(100vh - 100px)" display="flex" flexDirection="column">
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <div>
          <Typography fontWeight="700" sx={{ fontSize: '1.875rem', color: theme.palette.text.primary, mb: 0.5 }}>
            Analytics & Reports
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Generate, view, and export comprehensive system data.
          </Typography>
        </div>
        <Box display="flex" gap={2}>
          <Button 
            variant="outlined" 
            startIcon={<Filter size={18} />}
            onClick={() => setFilterOpen(true)}
            sx={{ borderRadius: '12px', px: 3, height: '42px', color: theme.palette.text.primary, borderColor: theme.palette.divider }}
          >
            Filter Data
          </Button>
          <Button 
            variant="contained" 
            startIcon={<Download size={18} />}
            onClick={() => handleDownload('All_System_Data')}
            sx={{ borderRadius: '12px', boxShadow: `0 8px 16px ${theme.palette.primary.main}40`, px: 3, height: '42px' }}
          >
            Export All
          </Button>
        </Box>
      </Box>

      {/* KPI Row (Charts Placeholder) */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3, mb: 4 }}>
        {[
          { label: 'Generated This Month', value: '24', trend: '+12%', icon: <Calendar size={24} /> },
          { label: 'Total Exports', value: '1,204', trend: '+5%', icon: <Download size={24} /> },
          { label: 'Most Requested', value: 'Violations', trend: 'Audit', icon: <ShieldAlert size={24} /> }
        ].map((stat, idx) => (
          <Box key={idx}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '16px',
                border: `1px solid ${theme.palette.divider}`,
                background: theme.palette.mode === 'dark' ? 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)' : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)', borderColor: theme.palette.primary.main }
              }}
            >
              <Avatar sx={{ bgcolor: `${theme.palette.primary.main}20`, color: theme.palette.primary.main, width: 56, height: 56 }}>
                {stat.icon}
              </Avatar>
              <Box>
                <Typography color="text.secondary" variant="body2" fontWeight="600" textTransform="uppercase" letterSpacing={1}>{stat.label}</Typography>
                <Box display="flex" alignItems="baseline" gap={1}>
                  <Typography variant="h4" fontWeight="800" color="text.primary">{stat.value}</Typography>
                  <Typography variant="subtitle2" color="success.main">{stat.trend}</Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        ))}
      </Box>

      {/* Recent Reports List */}
      <Typography variant="h6" fontWeight="700" mb={2}>Recent Generated Reports</Typography>
      <Box display="flex" flexDirection="column" gap={2}>
        {MOCK_REPORTS.map((report) => (
          <Paper
            key={report.id}
            elevation={0}
            sx={{
              p: 2,
              borderRadius: '12px',
              border: `1px solid ${theme.palette.divider}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#fff',
              transition: 'background 0.2s',
              '&:hover': { background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f8fafc' }
            }}
          >
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', color: theme.palette.text.primary }}>
                {report.icon}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight="600">{report.title}</Typography>
                <Typography variant="body2" color="text.secondary">Generated on {report.date} • {report.type}</Typography>
              </Box>
            </Box>
            <Button 
              variant="text" 
              color="primary" 
              startIcon={<Download size={16} />}
              onClick={() => handleDownload(report.title)}
              sx={{ fontWeight: '600' }}
            >
              Download ({report.downloads})
            </Button>
          </Paper>
        ))}
      </Box>

      {/* Filter Mock Dialog */}
      <Dialog open={filterOpen} onClose={() => setFilterOpen(false)} PaperProps={{ sx: { borderRadius: '16px', minWidth: '400px', p: 1 }}}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Filter Reports</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={3}>Select parameters to narrow down your analytics view.</Typography>
          <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
            <InputLabel>Report Type</InputLabel>
            <Select label="Report Type" defaultValue="all">
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="access">Access Logs</MenuItem>
              <MenuItem value="violations">Violations</MenuItem>
              <MenuItem value="parking">Parking</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth variant="outlined">
            <InputLabel>Date Range</InputLabel>
            <Select label="Date Range" defaultValue="30">
              <MenuItem value="7">Last 7 Days</MenuItem>
              <MenuItem value="30">Last 30 Days</MenuItem>
              <MenuItem value="90">Last Quarter</MenuItem>
              <MenuItem value="year">This Year</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setFilterOpen(false)} color="inherit" sx={{ borderRadius: '8px' }}>Cancel</Button>
          <Button onClick={() => { setFilterOpen(false); setSnackbarOpen(true); }} variant="contained" sx={{ borderRadius: '8px', px: 3 }}>Apply Filters</Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
          Filters applied successfully! (Mock)
        </Alert>
      </Snackbar>
    </Box>
  );
}
