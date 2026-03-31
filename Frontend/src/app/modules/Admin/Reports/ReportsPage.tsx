import { useEffect, useState, useMemo } from 'react';
import { 
  Box, Typography, Paper, useTheme, Button, 
  CircularProgress, MenuItem, Select, FormControl, InputLabel, 
  Avatar, Divider, Chip, useMediaQuery
} from '@mui/material';
import { Download, TrendingUp, AlertTriangle, Car, ShieldAlert } from 'lucide-react';
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
  const isTinyMobile = useMediaQuery('(max-width:340px)');
  const isSmallMobile = useMediaQuery('(max-width:400px)');
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [loading, setLoading] = useState(true);
  const [violationStatusStats, setViolationStatusStats] = useState<any[]>([]);
  const [parkingVolumeStats, setParkingVolumeStats] = useState<any[]>([]);
  const [revenueByTypeStats, setRevenueByTypeStats] = useState<any[]>([]);
  const [revenueTimeline, setRevenueTimeline] = useState<any[]>([]);
  const [zoneUtilization, setZoneUtilization] = useState<any[]>([]);
  const [topOffenders, setTopOffenders] = useState<any[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalParkings, setTotalParkings] = useState(0);
  const [timeframe, setTimeframe] = useState('month');
  const [zoneFilter, setZoneFilter] = useState('All');

  useEffect(() => { loadAllAnalytics(); }, [timeframe, zoneFilter]);

  const loadAllAnalytics = async () => {
    try {
      setLoading(true);
      const logFilters: any = {};
      if (zoneFilter !== 'All') logFilters.zone = zoneFilter;

      const [vStatus, pVolume, rByType, rTimeline, zUtil, topOffend, totalRevQuery, totalParkQuery] = await Promise.all([
        api.fetchAnalytics({ table: 'violations', groupBy: 'status', dateRange: timeframe, dateField: 'created_at' }),
        api.fetchAnalytics({ table: 'parking_logs', timeframe: 'day', dateRange: timeframe, dateField: 'created_at', filters: Object.keys(logFilters).length ? logFilters : undefined }),
        api.fetchAnalytics({ table: 'violations', groupBy: 'violation_type', metrics: ['sum'], metricField: 'amount', dateRange: timeframe, dateField: 'created_at' }),
        api.fetchAnalytics({ table: 'violations', timeframe: 'day', dateRange: timeframe, dateField: 'violation_date', metrics: ['sum'], metricField: 'amount' }),
        api.fetchAnalytics({ table: 'parking_logs', groupBy: 'zone', dateRange: timeframe, dateField: 'created_at', filters: Object.keys(logFilters).length ? logFilters : undefined }),
        api.fetchAnalytics({ table: 'violations', groupBy: 'vehicle_number', metrics: ['sum'], metricField: 'amount', dateRange: timeframe, dateField: 'created_at' }),
        api.fetchAnalytics({ table: 'violations', metrics: ['sum'], metricField: 'amount', dateRange: timeframe, dateField: 'created_at' }),
        api.fetchAnalytics({ table: 'parking_logs', dateRange: timeframe, dateField: 'created_at' })
      ]);

      setViolationStatusStats(vStatus);
      setParkingVolumeStats(pVolume);
      setRevenueByTypeStats(rByType);
      setRevenueTimeline(rTimeline);
      setZoneUtilization(zUtil.filter((z: any) => z.name && z.name !== 'Unknown'));
      setTopOffenders(topOffend.sort((a: any, b: any) => b.value - a.value).slice(0, 5));
      setTotalRevenue(Array.isArray(totalRevQuery) ? (totalRevQuery[0]?.value || 0) : 0);
      setTotalParkings(totalParkQuery?.total || 0);
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const data = revenueTimeline.map(s => `${s.name},${s.value}`).join('\n');
    const blob = new Blob([`Date,Revenue(INR)\n${data}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `report_${new Date().getTime()}.csv`; a.click();
  };

  const unpaidCount = useMemo(() => {
    const row = violationStatusStats.find(s => s.name === 'Unpaid');
    return row ? row.value : 0;
  }, [violationStatusStats]);

  const topZoneName = useMemo(() => {
    if (zoneUtilization.length === 0) return 'N/A';
    return [...zoneUtilization].sort((a, b) => b.value - a.value)[0].name;
  }, [zoneUtilization]);

  // Truncate long zone names for chart labels
  const truncate = (str: string, max: number) => str.length > max ? str.slice(0, max) + '…' : str;

  if (loading && parkingVolumeStats.length === 0) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress /></Box>;
  }

  const pad = isTinyMobile ? 1.25 : isSmallMobile ? 1.5 : isMobile ? 2 : 3;
  const cardRadius = isTinyMobile ? '12px' : '16px';
  const chartH = isTinyMobile ? 220 : isMobile ? 260 : 360;
  const sectionTitle = (text: string) => (
    <Typography fontWeight={700} sx={{ fontSize: isTinyMobile ? '0.85rem' : isMobile ? '0.95rem' : '1.1rem', mb: isTinyMobile ? 1 : 1.5 }}>
      {text}
    </Typography>
  );

  return (
    <Box sx={{ p: pad, maxWidth: '100vw', overflowX: 'hidden', boxSizing: 'border-box' }}>

      {/* ─── HEADER ─── */}
      <Box mb={isTinyMobile ? 2 : 3}>
        <Typography fontWeight={900} sx={{ 
          fontSize: isTinyMobile ? '1.75rem' : isSmallMobile ? '2.25rem' : '3.25rem', 
          letterSpacing: '-0.03em', lineHeight: 1.1, color: theme.palette.text.primary, mb: 1 
        }}>
          Reports & Analytics
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, opacity: 0.9, mb: 2 }}>
          Monitor parking activity, fines, and zone performance.
        </Typography>

        {/* Filters */}
        <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} gap={1} alignItems={isMobile ? 'stretch' : 'center'}>
          <Box display="flex" gap={1} width={isMobile ? '100%' : 'auto'}>
            <FormControl size="small" sx={{ flex: 1, minWidth: 0 }}>
              <InputLabel>Zone</InputLabel>
              <Select value={zoneFilter} label="Zone" onChange={(e) => setZoneFilter(e.target.value)}>
                {ZONES.map(z => <MenuItem key={z} value={z}>{z}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ flex: 1, minWidth: 0 }}>
              <InputLabel>Period</InputLabel>
              <Select value={timeframe} label="Period" onChange={(e) => setTimeframe(e.target.value)}>
                <MenuItem value="all">All Time</MenuItem>
                <MenuItem value="day">Today</MenuItem>
                <MenuItem value="week">7 Days</MenuItem>
                <MenuItem value="month">30 Days</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Button 
            variant="contained" startIcon={<Download size={16} />} onClick={handleExport} 
            fullWidth={isMobile}
            sx={{ height: '40px', borderRadius: '12px', textTransform: 'none', fontWeight: 600, fontSize: isTinyMobile ? '0.8rem' : '0.875rem', boxShadow: `0 6px 12px ${theme.palette.primary.main}30`, flexShrink: 0 }}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* ─── KPI CARDS ─── */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: isTinyMobile ? '1fr 1fr' : isSmallMobile ? '1fr 1fr' : { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
        gap: isTinyMobile ? 1 : isMobile ? 1.5 : 2,
        mb: isTinyMobile ? 2 : 3,
        opacity: loading ? 0.5 : 1, transition: 'opacity 0.3s'
      }}>
        {[
          { label: 'Total Fines', value: `₹${totalRevenue.toLocaleString()}`, icon: <TrendingUp size={isTinyMobile ? 16 : 20} />, color: theme.palette.success.main },
          { label: 'Unpaid', value: unpaidCount.toString(), icon: <AlertTriangle size={isTinyMobile ? 16 : 20} />, color: theme.palette.error.main },
          { label: 'Parkings', value: totalParkings.toLocaleString(), icon: <Car size={isTinyMobile ? 16 : 20} />, color: theme.palette.primary.main },
          { label: 'Top Zone', value: truncate(topZoneName, isTinyMobile ? 10 : 18), icon: <ShieldAlert size={isTinyMobile ? 16 : 20} />, color: theme.palette.warning.main }
        ].map((kpi, i) => (
          <Paper key={i} elevation={0} sx={{
            p: isTinyMobile ? 1.25 : isMobile ? 1.5 : 2.5,
            borderRadius: cardRadius,
            border: `1px solid ${theme.palette.divider}`,
            borderLeft: `3px solid ${kpi.color}`,
          }}>
            <Box sx={{ p: isTinyMobile ? 0.5 : 0.75, borderRadius: '8px', bgcolor: `${kpi.color}12`, color: kpi.color, display: 'inline-flex', mb: isTinyMobile ? 0.75 : 1 }}>
              {kpi.icon}
            </Box>
            <Typography color="text.secondary" fontWeight={700} sx={{ fontSize: isTinyMobile ? '0.55rem' : '0.65rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              {kpi.label}
            </Typography>
            <Typography fontWeight={800} sx={{ 
              fontSize: isTinyMobile ? '1rem' : isMobile ? '1.15rem' : '1.5rem', 
              mt: 0.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>
              {kpi.value}
            </Typography>
          </Paper>
        ))}
      </Box>

      {/* ─── CHARTS ─── */}
      <Box display="flex" flexDirection="column" gap={isTinyMobile ? 1.5 : isMobile ? 2 : 3} sx={{ opacity: loading ? 0.5 : 1, transition: 'opacity 0.3s' }}>

        {/* Fine Trends */}
        <Paper elevation={0} sx={{ p: isTinyMobile ? 1.25 : isMobile ? 1.5 : 3, borderRadius: cardRadius, border: `1px solid ${theme.palette.divider}` }}>
          {sectionTitle('Fine Trends')}
          <Box sx={{ width: '100%', height: chartH, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTimeline} margin={{ left: isTinyMobile ? -15 : 0, right: isTinyMobile ? 5 : 10, top: 5, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme.palette.success.main} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={theme.palette.success.main} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: isTinyMobile ? 8 : isMobile ? 10 : 12 }} interval={isTinyMobile ? 2 : isMobile ? 1 : 0} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: isTinyMobile ? 8 : isMobile ? 10 : 12 }} tickFormatter={v => `₹${v}`} width={isTinyMobile ? 35 : isMobile ? 45 : 60} />
                <Tooltip formatter={(val) => [`₹${val}`, 'Amount']} />
                <Area type="monotone" dataKey="value" stroke={theme.palette.success.main} strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Paper>

        {/* Zone Breakdown + Fines by Type — side by side on desktop, stacked on mobile */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: isTinyMobile ? 1.5 : isMobile ? 2 : 3 }}>
          
          {/* Zone Breakdown (Pie) */}
          <Paper elevation={0} sx={{ p: isTinyMobile ? 1.25 : isMobile ? 1.5 : 3, borderRadius: cardRadius, border: `1px solid ${theme.palette.divider}` }}>
            {sectionTitle('Zone Breakdown')}
            <Box sx={{ width: '100%', height: isTinyMobile ? 200 : isMobile ? 240 : 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={zoneUtilization}
                    innerRadius={isTinyMobile ? 35 : isMobile ? 45 : 65}
                    outerRadius={isTinyMobile ? 55 : isMobile ? 70 : 95}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {zoneUtilization.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => [val, 'Events']} />
                  <Legend 
                    verticalAlign="bottom" 
                    iconType="circle" 
                    iconSize={isTinyMobile ? 6 : 8}
                    formatter={(value: string) => <span style={{ fontSize: isTinyMobile ? '0.55rem' : isMobile ? '0.65rem' : '0.75rem', color: theme.palette.text.secondary }}>{truncate(value, isTinyMobile ? 12 : 20)}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>

          {/* Fines by Type (Bar) */}
          <Paper elevation={0} sx={{ p: isTinyMobile ? 1.25 : isMobile ? 1.5 : 3, borderRadius: cardRadius, border: `1px solid ${theme.palette.divider}` }}>
            {sectionTitle('Fines by Type')}
            <Box sx={{ width: '100%', height: isTinyMobile ? 200 : isMobile ? 240 : 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByTypeStats} layout="vertical" margin={{ left: isTinyMobile ? -10 : 0, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme.palette.divider} />
                  <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} tick={{ fontSize: isTinyMobile ? 8 : isMobile ? 10 : 12 }} />
                  <YAxis 
                    type="category" dataKey="name" axisLine={false} tickLine={false} 
                    width={isTinyMobile ? 55 : isMobile ? 75 : 120} 
                    tick={{ fontSize: isTinyMobile ? 8 : isMobile ? 10 : 13, fontWeight: 500 }} 
                    tickFormatter={(v: string) => truncate(v, isTinyMobile ? 8 : isMobile ? 12 : 25)}
                  />
                  <Tooltip formatter={(val) => [`₹${val}`, 'Amount']} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {revenueByTypeStats.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Box>

        {/* Top Fined Vehicles */}
        <Paper elevation={0} sx={{ p: isTinyMobile ? 1.25 : isMobile ? 1.5 : 3, borderRadius: cardRadius, border: `1px solid ${theme.palette.divider}` }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
            {sectionTitle('Top Fined Vehicles')}
            <Chip label="High Risk" color="error" size="small" sx={{ fontWeight: 700, fontSize: '0.6rem', height: '22px' }} />
          </Box>
          {topOffenders.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={3} sx={{ fontSize: '0.85rem' }}>No violations logged.</Typography>
          ) : (
            <Box>
              {topOffenders.map((offender, idx) => (
                <Box key={idx}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" py={1}>
                    <Box display="flex" alignItems="center" gap={1} sx={{ minWidth: 0, flex: 1 }}>
                      <Avatar sx={{ 
                        width: isTinyMobile ? 22 : 28, height: isTinyMobile ? 22 : 28, 
                        bgcolor: theme.palette.mode === 'dark' ? '#333' : '#eee', 
                        color: theme.palette.text.primary, fontWeight: 800, fontSize: isTinyMobile ? 9 : 11 
                      }}>
                        {idx + 1}
                      </Avatar>
                      <Typography fontWeight={700} sx={{ 
                        fontFamily: 'monospace', fontSize: isTinyMobile ? '0.7rem' : isMobile ? '0.8rem' : '0.9rem',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                      }}>
                        {offender.name}
                      </Typography>
                    </Box>
                    <Box textAlign="right" flexShrink={0} pl={1}>
                      <Typography fontWeight={800} color="error.main" sx={{ fontSize: isTinyMobile ? '0.75rem' : '0.9rem' }}>
                        ₹{offender.value.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: isTinyMobile ? '0.5rem' : '0.6rem' }}>
                        {offender.count} ticket(s)
                      </Typography>
                    </Box>
                  </Box>
                  {idx < topOffenders.length - 1 && <Divider />}
                </Box>
              ))}
            </Box>
          )}
        </Paper>
      </Box>
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
