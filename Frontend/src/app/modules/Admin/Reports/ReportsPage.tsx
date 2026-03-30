import { useEffect, useState, useMemo } from 'react';
import { 
  Box, Typography, Paper, useTheme, Button, 
  CircularProgress, MenuItem, Select, FormControl, InputLabel, 
  Grid, Avatar, Divider, Chip
} from '@mui/material';
import { Download, Filter, TrendingUp, AlertTriangle, Car, ShieldAlert } from 'lucide-react';
import { api } from '@utils/services/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';
import PermissionGuard from '@shared/components/PermissionGuard';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const ZONES = ['All', 'Near Dream wall', 'NCRC Building', 'CSE Department Entrance', 'Algorithm building Entrance side'];

const ReportsPage: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  
  // Datasets
  const [violationStatusStats, setViolationStatusStats] = useState<any[]>([]);
  const [parkingVolumeStats, setParkingVolumeStats] = useState<any[]>([]);
  const [revenueByTypeStats, setRevenueByTypeStats] = useState<any[]>([]);
  const [revenueTimeline, setRevenueTimeline] = useState<any[]>([]);
  const [zoneUtilization, setZoneUtilization] = useState<any[]>([]);
  const [topOffenders, setTopOffenders] = useState<any[]>([]);
  
  // Raw Aggregates
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalParkings, setTotalParkings] = useState(0);

  // Filters
  const [timeframe, setTimeframe] = useState('month');
  const [zoneFilter, setZoneFilter] = useState('All');

  useEffect(() => {
    loadAllAnalytics();
  }, [timeframe, zoneFilter]);

  const loadAllAnalytics = async () => {
    try {
      setLoading(true);
      
      const logFilters: any = {};
      if (zoneFilter !== 'All') logFilters.zone = zoneFilter;

      // Parallelize all heavy aggregations from Supabase
      const [
        vStatus, 
        pVolume, 
        rByType,
        rTimeline,
        zUtil,
        topOffend,
        totalRevQuery,
        totalParkQuery
      ] = await Promise.all([
        api.fetchAnalytics({ table: 'violations', groupBy: 'status', dateRange: timeframe, dateField: 'created_at' }),
        api.fetchAnalytics({ table: 'parking_logs', timeframe: 'day', dateRange: timeframe, dateField: 'created_at', filters: Object.keys(logFilters).length ? logFilters : undefined }),
        api.fetchAnalytics({ table: 'violations', groupBy: 'violation_type', metrics: ['sum'], metricField: 'amount', dateRange: timeframe, dateField: 'created_at' }),
        api.fetchAnalytics({ table: 'violations', timeframe: 'day', dateRange: timeframe, dateField: 'violation_date', metrics: ['sum'], metricField: 'amount' }),
        api.fetchAnalytics({ table: 'parking_logs', groupBy: 'zone', dateRange: timeframe, dateField: 'created_at', filters: Object.keys(logFilters).length ? logFilters : undefined }),
        api.fetchAnalytics({ table: 'violations', groupBy: 'vehicle_number', metrics: ['sum'], metricField: 'amount', dateRange: timeframe, dateField: 'created_at' }),
        // Global sums
        api.fetchAnalytics({ table: 'violations', metrics: ['sum'], metricField: 'amount', dateRange: timeframe, dateField: 'created_at' }),
        api.fetchAnalytics({ table: 'parking_logs', dateRange: timeframe, dateField: 'created_at' })
      ]);

      setViolationStatusStats(vStatus);
      setParkingVolumeStats(pVolume);
      setRevenueByTypeStats(rByType);
      setRevenueTimeline(rTimeline);
      
      // Clean up zone empty strings
      setZoneUtilization(zUtil.filter((z: any) => z.name && z.name !== 'Unknown'));
      
      // Sort offenders by value descending to get Top 5
      const sortedOffenders = topOffend.sort((a: any, b: any) => b.value - a.value).slice(0, 5);
      setTopOffenders(sortedOffenders);

      // System wide globals (Timeframe unaware unless enforced)
      // totalRevQuery returns an array [{name: 'Default', value: sum}] due to metrics: ['sum']
      setTotalRevenue(Array.isArray(totalRevQuery) ? (totalRevQuery[0]?.value || 0) : 0);
      
      // totalParkQuery returns an object { total: count, data: [...] } due to no grouping and no sum
      setTotalParkings(totalParkQuery?.total || 0);
      
    } catch (err) {
      console.error('Failed to load deep analytics', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const data = revenueTimeline.map(s => `${s.name},${s.value}`).join('\n');
    const blob = new Blob([`Date,Revenue(INR)\n${data}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue_report_${new Date().getTime()}.csv`;
    a.click();
  };

  // KPIs
  const unpaidCount = useMemo(() => {
    const unpaidRow = violationStatusStats.find(s => s.name === 'Unpaid');
    return unpaidRow ? unpaidRow.value : 0;
  }, [violationStatusStats]);

  const topZoneName = useMemo(() => {
    if (zoneUtilization.length === 0) return 'N/A';
    const top = [...zoneUtilization].sort((a, b) => b.value - a.value)[0];
    return top.name;
  }, [zoneUtilization]);

  if (loading && parkingVolumeStats.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3} minHeight="calc(100vh - 100px)">
      {/* Dashboard Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <Typography variant="h4" fontWeight={800} gutterBottom>Executive Dashboard</Typography>
          <Typography color="text.secondary">Comprehensive Business Intelligence and Operational Telemetry</Typography>
        </div>
        
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          <Paper elevation={0} sx={{ display: 'flex', gap: 2, p: 1, borderRadius: '12px', border: `1px solid ${theme.palette.divider}` }}>
            <Box display="flex" alignItems="center" gap={1} px={1}>
              <Filter size={16} color={theme.palette.text.secondary} />
              <Typography variant="body2" color="text.secondary" fontWeight={600}>Dimensions</Typography>
            </Box>
            
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Traffic Zone</InputLabel>
              <Select value={zoneFilter} label="Traffic Zone" onChange={(e) => setZoneFilter(e.target.value)}>
                {ZONES.map(z => <MenuItem key={z} value={z}>{z}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Date Filter</InputLabel>
              <Select value={timeframe} label="Date Filter" onChange={(e) => setTimeframe(e.target.value)}>
                <MenuItem value="all">All Time</MenuItem>
                <MenuItem value="day">Today</MenuItem>
                <MenuItem value="week">Past 7 Days</MenuItem>
                <MenuItem value="month">Past 30 Days</MenuItem>
              </Select>
            </FormControl>
          </Paper>

          <Button variant="contained" startIcon={<Download size={18} />} onClick={handleExport} sx={{ height: '48px', borderRadius: '12px', boxShadow: `0 8px 16px ${theme.palette.primary.main}40` }}>
            Export Financials
          </Button>
        </Box>
      </header>

      {/* KPI SCORECARDS (PowerBI Style) */}
      <Grid container spacing={3} sx={{ mb: 4, opacity: loading ? 0.6 : 1, transition: 'opacity 0.3s' }}>
        {[
          { label: 'Total Fines Logged', value: `₹${totalRevenue.toLocaleString()}`, sub: 'Lifetime Recovery Potential', icon: <TrendingUp size={24} />, color: theme.palette.success.main },
          { label: 'Unresolved Actions', value: unpaidCount.toString(), sub: 'Vehicles require clamping', icon: <AlertTriangle size={24} />, color: theme.palette.error.main },
          { label: 'System Traffic', value: totalParkings.toLocaleString(), sub: 'Lifetime Validated Gates', icon: <Car size={24} />, color: theme.palette.primary.main },
          { label: 'Highest Traffic Zone', value: topZoneName, sub: 'Requires frequent patrol', icon: <ShieldAlert size={24} />, color: theme.palette.warning.main }
        ].map((kpi, i) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '16px',
                border: `1px solid ${theme.palette.divider}`,
                borderLeft: `4px solid ${kpi.color}`,
                background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.01)' : 'rgba(0,0,0,0.01)',
                display: 'flex',
                alignItems: 'center',
                gap: 2.5
              }}
            >
              <Avatar sx={{ bgcolor: `${kpi.color}15`, color: kpi.color, width: 50, height: 50 }}>
                {kpi.icon}
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">{kpi.label}</Typography>
                <Typography variant="h5" fontWeight={800} color="text.primary" sx={{ my: 0.5 }}>{kpi.value}</Typography>
                <Typography variant="caption" color="text.secondary">{kpi.sub}</Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* CHARTS GRID */}
      <Grid container spacing={3} sx={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.3s' }}>
        
        {/* Row 1: Revenue Timeline (Large) */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper sx={{ p: 3, borderRadius: '16px', height: '400px', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" fontWeight={700} mb={2}>Penalty Revenue Generation</Typography>
            <Box flex={1}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTimeline}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={theme.palette.success.main} stopOpacity={0.5}/>
                      <stop offset="95%" stopColor={theme.palette.success.main} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={v => `₹${v}`} />
                  <Tooltip formatter={(val) => [`₹${val}`, 'Fined Amount']} cursor={{ fill: 'transparent', stroke: theme.palette.divider }} />
                  <Area type="monotone" name="Revenue" dataKey="value" stroke={theme.palette.success.main} strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Row 1: Zone Tracking (Donut) */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper sx={{ p: 3, borderRadius: '16px', height: '400px', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" fontWeight={700} mb={1}>Zone Utilization Hub</Typography>
            <Typography variant="caption" color="text.secondary" mb={2}>Relative allocation of all tracked access events.</Typography>
            <Box flex={1}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={zoneUtilization}
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {zoneUtilization.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => [val, 'Access Events']} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Row 2: Revenue By Type (Bar) */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Paper sx={{ p: 3, borderRadius: '16px', height: '400px', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" fontWeight={700} mb={3}>Financial Impact by Category</Typography>
            <Box flex={1}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByTypeStats} layout="vertical" margin={{ left: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme.palette.divider} />
                  <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={120} tick={{ fontSize: 13, fontWeight: 500 }} />
                  <Tooltip formatter={(val) => [`₹${val}`, 'Revenue Potential']} cursor={{ fill: theme.palette.mode === 'dark' ? '#333' : '#f5f5f5' }} />
                  <Bar dataKey="value" fill={theme.palette.primary.main} radius={[0, 4, 4, 0]}>
                    {revenueByTypeStats.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Row 2: Top Offenders Table / List */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Paper sx={{ p: 3, borderRadius: '16px', height: '400px', display: 'flex', flexDirection: 'column' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={700}>Top Target Vehicles</Typography>
              <Chip label="High Risk" color="error" size="small" sx={{ fontWeight: 700 }} />
            </Box>
            <Typography variant="caption" color="text.secondary" mb={2}>
              Vehicles driving the highest unpaid fines over all time. 
            </Typography>
            
            <Box flex={1} overflow="auto" px={1}>
              {topOffenders.length === 0 ? (
                 <Typography color="text.secondary" textAlign="center" mt={4}>No infractions logged.</Typography>
              ) : (
                topOffenders.map((offender, idx) => (
                  <Box key={idx} mb={idx < topOffenders.length -1 ? 2 : 0}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.mode === 'dark' ? '#333' : '#eee', color: theme.palette.text.primary, fontWeight: 800, fontSize: 13 }}>
                          #{idx + 1}
                        </Avatar>
                        <Typography variant="body1" fontWeight={700} letterSpacing="1px" sx={{ fontFamily: 'monospace' }}>
                          {offender.name}
                        </Typography>
                      </Box>
                      <Box textAlign="right">
                        <Typography variant="body1" fontWeight={800} color="error.main">₹{offender.value.toLocaleString()}</Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>{offender.count} Ticket(s)</Typography>
                      </Box>
                    </Box>
                    {idx < topOffenders.length - 1 && <Divider />}
                  </Box>
                ))
              )}
            </Box>
          </Paper>
        </Grid>
        
      </Grid>
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
