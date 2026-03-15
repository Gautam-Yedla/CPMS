export const logActivity = async (supabase: any, userId: string, action: string, details: string) => {
  console.log(`[ActivityLog] User: ${userId} | Action: ${action} | Details: ${details}`);
  try {
    const { error } = await supabase
      .from('activity_logs')
      .insert({
        user_id: userId,
        action_type: action,
        details,
      });
    if (error) throw error;
  } catch (err: any) {
    console.warn('Failed to save activity log to DB:', err.message);
  }
};
