import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { logActivity } from '../utils/activityLogger.js';

const router = express.Router();

// GET /api/vehicles
// Get the vehicle associated with the user profile
router.get('/', authMiddleware, async (req: any, res) => {
  const userId = req.user.id;

  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: req.headers.authorization! } }
    });

    const { data, error } = await supabase
      .from('profiles')
      .select('vehicle_number, vehicle_type, vehicle_make_model, vehicle_color')
      .eq('id', userId)
      .single();

    if (error) throw error;

    res.json({
      vehicle_number: data.vehicle_number,
      vehicle_type: data.vehicle_type,
      vehicle_make_model: data.vehicle_make_model,
      vehicle_color: data.vehicle_color
    });
  } catch (err: any) {
    console.error('Error fetching vehicle:', err);
    res.status(500).json({ error: 'Error fetching vehicle details' });
  }
});

// POST /api/vehicles
// Register or update vehicle on profile
router.post('/', authMiddleware, async (req: any, res) => {
  const userId = req.user.id;
  const { number, type, make_model, color, vehicle_number } = req.body;
  
  // Support both 'number' (frontend) and 'vehicle_number' (backend internal)
  const final_number = number || vehicle_number;
  const final_type = type || req.body.vehicle_type || 'Four-wheeler';
  const final_make_model = make_model || req.body.vehicle_make_model;
  const final_color = color || req.body.vehicle_color;

  if (!final_number) {
    return res.status(400).json({ error: 'Vehicle number is required' });
  }

  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: req.headers.authorization! } }
    });

    const { data, error } = await supabase
      .from('profiles')
      .update({
        vehicle_number: final_number,
        vehicle_type: final_type,
        vehicle_make_model: final_make_model,
        vehicle_color: final_color,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    await logActivity(supabase, userId, 'REGISTER_VEHICLE', `Registered vehicle: ${final_number} (${final_make_model || 'Unknown'})`);

    res.json({
      vehicle_number: data.vehicle_number,
      vehicle_type: data.vehicle_type,
      vehicle_make_model: data.vehicle_make_model,
      vehicle_color: data.vehicle_color
    });
  } catch (err: any) {
    console.error('Error registering vehicle:', err);
    res.status(500).json({ error: 'Error registering vehicle' });
  }
});

// DELETE /api/vehicles
router.delete('/', authMiddleware, async (req: any, res) => {
  const userId = req.user.id;

  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: req.headers.authorization! } }
    });

    const { data, error } = await supabase
      .from('profiles')
      .update({
        vehicle_number: null,
        vehicle_type: null,
        vehicle_make_model: null,
        vehicle_color: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    await logActivity(supabase, userId, 'DELETE_VEHICLE', 'Removed vehicle from profile');

    res.json({ message: 'Vehicle removed successfully' });
  } catch (err: any) {
    console.error('Error removing vehicle:', err);
    res.status(500).json({ error: 'Error removing vehicle' });
  }
});

export default router;
