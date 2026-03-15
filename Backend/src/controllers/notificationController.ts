import type { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

export const getUserNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    // Auth middleware ensures (req as any).user exists
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Error fetching notifications' });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .match({ id, user_id: userId }) // Ensure the specific notification belongs to the user
      .select()
      .single();

    if (error) throw error;
    
    // Might return 404 naturally if match fails to find a record,
    // but the supabase JS client throws PGRST116 for single() when 0 rows match
    res.json(data);
  } catch (err: any) {
    if (err.code === 'PGRST116') {
      return res.status(404).json({ error: 'Notification not found or unauthorized' });
    }
    console.error(`Error marking notification as read (id=${req.params.id}):`, err);
    res.status(500).json({ error: 'Error updating notification' });
  }
};

export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .match({ user_id: userId, is_read: false })
      .select();

    if (error) throw error;
    res.json({ message: 'All notifications marked as read', updatedCount: data?.length || 0 });
  } catch (err: any) {
    console.error('Error marking all notifications as read:', err);
    res.status(500).json({ error: 'Error processing request' });
  }
};
