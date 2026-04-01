import type { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { NotificationService, NotificationChannel } from '../services/notificationService.js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

export const getUserNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const supabase = (req as any).supabase; // Use authenticated client from middleware
    
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

export const getAllNotifications = async (req: Request, res: Response) => {
  try {
    const supabase = (req as any).supabase;
    
    // Fetch all notifications from all users, joining profiles to get names
    const { data, error } = await supabase
      .from('notifications')
      .select('*, profiles(full_name, department)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    console.error('Error fetching all notifications:', err);
    res.status(500).json({ error: 'Error fetching notifications' });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const supabase = (req as any).supabase;

    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .match({ id, user_id: userId })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    if (err.code === 'PGRST116') {
      return res.status(404).json({ error: 'Notification not found or unauthorized' });
    }
    res.status(500).json({ error: 'Error updating notification' });
  }
};

export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const supabase = (req as any).supabase;

    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .match({ user_id: userId, is_read: false })
      .select();

    if (error) throw error;
    res.json({ message: 'All notifications marked as read', updatedCount: data?.length || 0 });
  } catch (err: any) {
    res.status(500).json({ error: 'Error processing request' });
  }
};

/**
 * Generic notification trigger (Internal or Admin use)
 */
export const triggerNotification = async (req: Request, res: Response) => {
    try {
        const { userId, title, description, type, channels } = req.body;
        
        await NotificationService.notify(userId, { title, description, type }, channels);
        
        res.json({ success: true, message: 'Notification dispatched' });
    } catch (err) {
        console.error('Trigger Notification Error:', err);
        res.status(500).json({ error: 'Failed to dispatch notification' });
    }
};
