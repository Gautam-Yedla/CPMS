import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// GET /api/cameras - List all cameras
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('cameras')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/cameras - Add new camera (Admin only)
router.post('/', authMiddleware, async (req: any, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can add cameras' });
  }

  const { name, location, type, url, config } = req.body;
  
  try {
    const { data, error } = await supabase
      .from('cameras')
      .insert({ name, location, type, url, config })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/cameras/:id - Update camera
router.put('/:id', authMiddleware, async (req: any, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can update cameras' });
  }

  const { id } = req.params;
  const updates = req.body;

  try {
    const { data, error } = await supabase
      .from('cameras')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/cameras/:id - Soft delete
router.delete('/:id', authMiddleware, async (req: any, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can delete cameras' });
  }

  const { id } = req.params;

  try {
    const { error } = await supabase
      .from('cameras')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
