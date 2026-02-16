import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { logActivity } from '../utils/activityLogger.js';

const router = express.Router();

// GET /api/user/:userId/profile
// Protected by authMiddleware - ensures user is logged in
router.get('/:userId/profile', authMiddleware, async (req, res) => {
  const { userId } = req.params;

  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: req.headers.authorization! } }
    });

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'User profile not found' });
      }
      throw error;
    }

    res.json(data);
  } catch (err: any) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Error fetching user profile' });
  }
});

// PUT /api/user/:userId/profile
// Update user profile details
router.put('/:userId/profile', authMiddleware, async (req: any, res) => {
  const { userId } = req.params;
  const { full_name, department, avatar_url } = req.body;

  // Security check: ensure requesting user matches target user
  if (req.user.id !== userId) {
    return res.status(403).json({ error: 'Unauthorized to update this profile' });
  }

  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: req.headers.authorization! } }
    });

    // 1. Fetch current data
    const { data: currentProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('full_name, department, avatar_url')
      .eq('id', userId)
      .single();
      
    if (fetchError) throw fetchError;

    // 2. Perform Update
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        full_name,
        department,
        avatar_url,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // 3. Calculate Logs
    const changes: string[] = [];
    if (currentProfile.full_name !== full_name) changes.push(`Name changed from '${currentProfile.full_name}' to '${full_name}'`);
    if (currentProfile.department !== department) changes.push(`Department updated from '${currentProfile.department || 'None'}' to '${department}'`);
    if (currentProfile.avatar_url !== avatar_url) changes.push('Profile picture updated');

    const logDetails = changes.length > 0 ? changes.join('. ') : 'Profile updated (No changes stored)';

    await logActivity(supabase, userId, 'UPDATE_PROFILE', logDetails);
    res.json(data);
  } catch (err: any) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Error updating user profile' });
  }
});

export default router;
