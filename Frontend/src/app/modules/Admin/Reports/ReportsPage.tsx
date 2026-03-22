import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, Paper, useTheme, Button, 
  CircularProgress, MenuItem, Select, FormControl, InputLabel 
} from '@mui/material';
import { Download } from 'lucide-react';
import { api } from '@utils/services/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import PermissionGuard from '@shared/components/PermissionGuard';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const ReportsPage: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [violationStats, setViolationStats] = useState<any[]>([]);
  const [parkingStats, setParkingStats] = useState<any[]>([]);
  const [revenueStats, setRevenueStats] = useState<any[]>([]);
  const [timeframe, setTimeframe] = useState('month');

  useEffect(() => {
    loadAllAnalytics();
  }, [timeframe]);

  const loadAllAnalytics = async () => {
    try {
      setLoading(true);
      const [violations, logs, revenue] = await Promise.all([
        api.fetchAnalytics({ table: 'violations', groupBy: 'status' }),
        api.fetchAnalytics({ table: 'parking_logs', timeframe: timeframe, dateField: 'created_at' }),
        api.fetchAnalytics({ table: 'violations', groupBy: 'violation_type' })
      ]);

      setViolationStats(violations);
      setParkingStats(logs);
      setRevenueStats(revenue);
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const data = parkingStats.map(s => `${s.name},${s.value}`).join('\n');
    const blob = new Blob([`Name,Value\n${data}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${new Date().getTime()}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <Typography variant="h4" fontWeight={800} gutterBottom>Analytics & Reports</Typography>
          <Typography color="text.secondary">Real-time system performance and enforcement audit.</Typography>
        </div>
        <Box display="flex" gap={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Timeframe</InputLabel>
            <Select value={timeframe} label="Timeframe" onChange={(e) => setTimeframe(e.target.value)}>
              <MenuItem value="day">Last 24 Hours</MenuItem>
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" startIcon={<Download size={18} />} onClick={handleExport}>
            Export Data
          </Button>
        </Box>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}>
        {/* Violation Status - Pie Chart */}
        <div style={{ gridColumn: 'span 4' }}>
          <Paper sx={{ p: 3, borderRadius: '16px', height: '400px', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" fontWeight={700} mb={2}>Enforcement Mix</Typography>
            <Box flex={1}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={violationStats}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {violationStats.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
            <Box display="flex" flexWrap="wrap" justifyContent="center" gap={1} mt={2}>
              {violationStats.map((s, i) => (
                <Box key={i} display="flex" alignItems="center" gap={0.5}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: COLORS[i % COLORS.length] }} />
                  <Typography variant="caption">{s.name}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </div>

        {/* Activity Trend - Area Chart */}
        <div style={{ gridColumn: 'span 8' }}>
          <Paper sx={{ p: 3, borderRadius: '16px', height: '400px' }}>
            <Typography variant="h6" fontWeight={700} mb={2}>Traffic Activity Trend</Typography>
            <Box sx={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={parkingStats}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke={theme.palette.primary.main} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </div>

        {/* Violation Types - Bar Chart */}
        <div style={{ gridColumn: 'span 12' }}>
          <Paper sx={{ p: 3, borderRadius: '16px' }}>
            <Typography variant="h6" fontWeight={700} mb={3}>Violation Categories</Typography>
            <Box sx={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueStats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="value" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </div>
      </div>
    </Box>
  );
};

export default function PermissionWrappedReports() {
  return (
    <PermissionGuard permission="reports.view">
      <ReportsPage />
    </PermissionGuard>
  );
}
