import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { checkPermission } from '../middleware/permissionMiddleware.js';
import { MLBridgeService } from '../services/mlBridge.js';

const router = express.Router();

// GET /api/dashboard/stats
router.get('/stats', authMiddleware, async (req: any, res) => {
  const userId = req.user.id;

  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: req.headers.authorization! } }
    });

    // Parallel fetch for stats
    const [
      { count: permitCount },
      { count: activePermitCount },
      { data: violations },
      { data: recentLogs }
    ] = await Promise.all([
      supabase.from('permits').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('permits').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'Active'),
      supabase.from('violations').select('amount, status').eq('user_id', userId),
      supabase.from('parking_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5)
    ]);

    const totalFines = (violations || []).reduce((acc: number, v: any) => acc + (Number(v.amount) || 0), 0);
    const unpaidFines = (violations || []).filter((v: any) => v.status === 'Unpaid').reduce((acc: number, v: any) => acc + (Number(v.amount) || 0), 0);

    res.json({
      permits: {
        total: permitCount || 0,
        active: activePermitCount || 0,
      },
      violations: {
        totalFines,
        unpaidFines,
        count: (violations || []).length
      },
      recentActivity: recentLogs || []
    });
  } catch (err: any) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ error: 'Error fetching dashboard statistics' });
  }
});

// GET /api/dashboard/health - Check system operational status
router.get('/health', authMiddleware, checkPermission('system.health.view'), async (req, res) => {
  try {
    const isHealthy = await MLBridgeService.checkHealth();
    res.json({ 
        mlService: isHealthy ? 'Online' : 'Offline',
        timestamp: new Date().toISOString(),
        status: isHealthy ? 'Healthy' : 'Degraded'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch system health' });
  }
});

// GET /api/dashboard/zones - Fetch occupancy for specific zones
router.get('/zones', authMiddleware, checkPermission('zones.faculty.view'), async (req, res) => {
  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: req.headers.authorization! } }
    });

    // Fetch latest detections from faculty-specific zones
    // For now, we assume faculty zones are tagged in the camera/detection metadata
    const { data, error } = await supabase
      .from('camera_detections')
      .select('*, cameras!inner(name, location)')
      .ilike('cameras.location', '%Faculty%') // Simplified filter
      .order('timestamp', { ascending: false })
      .limit(10);

    if (error) throw error;
    res.json(data);
  } catch (err) {
      console.error('Error fetching zone occupancy:', err);
    res.status(500).json({ error: 'Failed to fetch zone occupancy' });
  }
});

export default router;
