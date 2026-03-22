import type { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

/**
 * Middleware to check if the current user has a specific permission.
 * Assumes req.user and req.user.role are populated by authMiddleware.
 */
export const checkPermission = (requiredPermission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).user?.role;
    const authHeader = req.headers.authorization;

    if (!userRole) {
      return res.status(403).json({ error: 'Role not found for user' });
    }

    // Admins have all permissions by default
    if (userRole.toLowerCase() === 'admin') {
      return next();
    }

    try {
      const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: authHeader! } } }
      );

      // Check if the permission is associated with the user's role
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*, roles!inner(name), permissions!inner(name)')
        .eq('roles.name', userRole)
        .eq('permissions.name', requiredPermission)
        .single();

      if (error || !data) {
        console.warn(`[checkPermission] Permission denied for role '${userRole}': ${requiredPermission}`);
        return res.status(403).json({ 
          error: `Permission denied. Required capability: ${requiredPermission}` 
        });
      }

      next();
    } catch (err) {
      console.error('Error in permissionMiddleware:', err);
      res.status(500).json({ error: 'Internal server error during authorization' });
    }
  };
};
