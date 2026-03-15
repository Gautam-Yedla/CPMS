import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

const getSupabase = (req: any) => {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: req.headers.authorization! } }
  });
};

// GET all violations
router.get('/', authMiddleware, async (req, res) => {
  try {
    const supabase = getSupabase(req);

    const { data: violations, error } = await supabase
      .from('violations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(violations);
  } catch (error: any) {
    console.error('Error fetching violations:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch violations' });
  }
});

export default router;
