import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { checkPermission } from '../middleware/permissionMiddleware.js';

const router = Router();

const getSupabase = (req: any) => {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: req.headers.authorization! } }
  });
};

// GET all violations (Admin/Security)
router.get('/', authMiddleware, checkPermission('fines.view.all'), async (req, res) => {
  try {
    const supabase = getSupabase(req);

    const { data: violations, error } = await supabase
      .from('violations')
      .select('*, users(full_name, email)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(violations);
  } catch (error: any) {
    console.error('Error fetching violations:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch violations' });
  }
});

// GET my violations
router.get('/me', authMiddleware, checkPermission('fines.view.own'), async (req: any, res) => {
  try {
    const supabase = getSupabase(req);
    const userId = req.user.id;

    const { data: violations, error } = await supabase
      .from('violations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(violations);
  } catch (error: any) {
    console.error('Error fetching my violations:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch your violations' });
  }
});

// PUT pay a violation
router.put('/:id/pay', authMiddleware, checkPermission('fines.pay.own'), async (req: any, res) => {
  try {
    const supabase = getSupabase(req);
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role?.toLowerCase();

    // Check if the violation exists and belongs to the user (unless admin)
    const { data: violation, error: fetchErr } = await supabase
      .from('violations')
      .select('user_id, status')
      .eq('id', id)
      .single();

    if (fetchErr || !violation) {
      return res.status(404).json({ error: 'Violation not found' });
    }

    if (violation.user_id !== userId && userRole !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to pay this fine' });
    }

    if (violation.status === 'Paid') {
      return res.status(400).json({ error: 'Violation is already paid' });
    }

    const { data, error } = await supabase
      .from('violations')
      .update({ status: 'Paid' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    console.error('Error paying violation:', error);
    res.status(500).json({ error: error.message || 'Failed to pay violation' });
  }
});

export default router;
