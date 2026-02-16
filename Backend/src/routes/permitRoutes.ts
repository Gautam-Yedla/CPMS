import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { logActivity } from '../utils/activityLogger.js';

const router = express.Router();

// GET /api/permits/active
// Get the current active permit for the user
router.get('/active', authMiddleware, async (req: any, res) => {
  const userId = req.user.id;

  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: req.headers.authorization! } }
    });

    // Fetch the most recent active or pending permit
    const { data, error } = await supabase
      .from('permits')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['Active', 'Pending'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
       if (error.code === 'PGRST116') {
         return res.json(null); // No active permit
       }
       throw error;
    }

    res.json(data);
  } catch (err: any) {
    console.error('Error fetching active permit:', err);
    res.status(500).json({ error: 'Error fetching permit details' });
  }
});

// GET /api/permits/history
// Get permit history
router.get('/history', authMiddleware, async (req: any, res) => {
  const userId = req.user.id;

  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: req.headers.authorization! } }
    });

    const { data, error } = await supabase
      .from('permits')
      .select('*')
      .eq('user_id', userId)
      .neq('status', 'Active') // Fetch inactive/expired permits
      .order('created_at', { ascending: false });

    if (error) throw error;

    // await logActivity(userId, 'FETCH_HISTORY', `Viewed permit history`); // Too noisy? User asked for every possible action. Let's keep it but maybe 'VIEW_HISTORY' is better?
    // Actually, usually we log mutations. Logging every read might spam the DB.
    // The user said "every possible action". I will log it.
    // Log removed as per user request (too noisy)
    // await logActivity(supabase, userId, 'VIEW_PERMIT_HISTORY', `Viewed permit history`);
    res.json(data);
  } catch (err: any) {
    console.error('Error fetching permit history:', err);
    res.status(500).json({ error: 'Error fetching permit history' });
  }
});

// POST /api/permits/apply
// Apply for a new permit
router.post('/apply', authMiddleware, async (req: any, res) => {
  const userId = req.user.id;
  const { vehicle_number, permit_type, zone } = req.body;

  if (!vehicle_number) {
    return res.status(400).json({ error: 'Vehicle number is required' });
  }

  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: req.headers.authorization! } }
    });

    // 1. Check if already has active permit
    const { data: existing, error: checkError } = await supabase
      .from('permits')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'Active')
      .single();

    if (existing) {
       return res.status(400).json({ error: 'You already have an active permit.' });
    }

    // 2. Create new permit
    // Calculate expiry (e.g., 6 months from now)
    const issueDate = new Date();
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 6);

    const { data, error } = await supabase
      .from('permits')
      .insert({
        user_id: userId,
        vehicle_number,
        permit_type: permit_type || 'Standard',
        zone: zone || 'Zone A', // Auto-assign or user selected?
        spot: `A-${Math.floor(Math.random() * 100) + 1}`, // Mock spot assignment
        issue_date: issueDate.toISOString(),
        // expiry_date: expiryDate.toISOString(), // Expiry set on approval? Or tentative? Let's keep it null or tentative.
        // Better to set expiry only when active.
        status: 'Pending'
      })
      .select()
      .single();

    if (error) throw error;
    
    await logActivity(supabase, userId, 'APPLY_PERMIT', `Applied for ${permit_type || 'Standard'} permit (Pending Approval)`);
    await supabase.from('profiles').update({ 
        permit_status: 'Pending',
        // permit_expiry: expiryDate.toISOString() // Don't set expiry yet
    }).eq('id', userId);

    res.json(data);
  } catch (err: any) {
    console.error('Error applying for permit:', err);
    res.status(500).json({ error: 'Error applying for permit' });
  }
});

export default router;
