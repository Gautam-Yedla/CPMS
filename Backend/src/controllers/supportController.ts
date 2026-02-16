import type { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

// Get all tickets (Admin sees all, User sees own - Logic handled here or by params)
export const getTickets = async (req: any, res: Response) => {
  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: req.headers.authorization! } }
    });

    const { id: userId, role: authRole } = req.user; 
    // Note: req.user.role is usually 'authenticated'. App role should be checked via profiles/metadata if needed.
    // For now assuming existing logic relied on this or it's just for 'admin' check which might be in metadata.
    // Let's check app_metadata for role if standard role is just 'authenticated'
    const role = req.user.app_metadata?.role || req.user.user_metadata?.role || 'student';

    console.log(`[getTickets] User: ${userId}, Role: ${role}`); // DEBUG LOG

    let query = supabase
      .from('support_tickets')
      .select('*, profiles(full_name, email)'); // fetch email from profiles now

    // If not admin, restrict to own tickets
    if (role !== 'admin' && role !== 'Admin') {
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
    res.json(data);
  } catch (err: any) {
    console.error('Error updating ticket:', err);
    res.status(500).json({ error: 'Failed to update ticket' });
  }
};
