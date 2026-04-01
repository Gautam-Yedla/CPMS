import type { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { NotificationService } from '../services/notificationService.js';

// Get all tickets (Admin sees all, User sees own - Logic handled here or by params)
export const getTickets = async (req: any, res: Response) => {
  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: req.headers.authorization! } }
    });

    const { id: userId, role } = req.user; 
    
    console.log(`[getTickets] User: ${userId}, Role: ${role}`); // DEBUG LOG

    let query = supabase
      .from('support_tickets')
      .select('*, profiles(full_name, email)'); 

    // If not admin, restrict to own tickets
    if (role?.toLowerCase() !== 'admin') {
       query = query.eq('user_id', userId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    console.error('Error fetching tickets:', err);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
};

// Create a new ticket
export const createTicket = async (req: any, res: Response) => {
  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: req.headers.authorization! } }
    });

    const { subject, message, priority, category } = req.body;
    const { id: userId } = req.user; // Correctly map 'id' to 'userId'

    // Supabase constraints are lowercase 'low', 'medium', 'high'
    const formattedPriority = priority ? priority.toLowerCase() : 'medium';

    const { data, error } = await supabase
      .from('support_tickets')
      .insert([
        { 
            user_id: userId, 
            subject, 
            message, 
            priority: formattedPriority,
            category: category || 'General' // Default category if missing
        }
      ])
      .select()
      .single();

    if (error) throw error;

    try {
        await NotificationService.notify(userId, {
            title: 'Support Ticket Created',
            description: `Your support ticket "${subject}" has been received. Our team will review it shortly.`,
            type: 'system'
        });
        // Notify admins that a new ticket was created
        await NotificationService.notifyAdmins(supabase, {
            title: 'New Support Ticket',
            description: `A new support ticket "${subject}" has been submitted and is awaiting review.`,
            type: 'system'
        });
    } catch (notifErr) {
        console.error('Failed to send ticket creation notification:', notifErr);
    }

    res.status(201).json(data);
  } catch (err: any) {
    console.error('Error creating ticket:', err);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
};

// Update ticket (Status, Priority, or add reply - Reply logic typically separate but simple update here)
export const updateTicket = async (req: any, res: Response) => {
  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: req.headers.authorization! } }
    });

    const { id } = req.params;
    const { status, priority } = req.body;

    const updates: any = { updated_at: new Date().toISOString() };
    if (status) updates.status = status.toLowerCase();
    if (priority) updates.priority = priority.toLowerCase();

    const { data, error } = await supabase
      .from('support_tickets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    try {
        await NotificationService.notify(data.user_id, {
            title: 'Support Ticket Updated',
            description: `Your support ticket has been updated. Status: ${data.status.toUpperCase()}, Priority: ${data.priority.toUpperCase()}`,
            type: 'system'
        });
    } catch (notifErr) {
        console.error('Failed to send ticket update notification:', notifErr);
    }

    res.json(data);
  } catch (err: any) {
    console.error('Error updating ticket:', err);
    res.status(500).json({ error: 'Failed to update ticket' });
  }
};
