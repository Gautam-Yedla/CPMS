import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { authMiddleware } from '../middleware/authMiddleware.js';

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

export default router;
