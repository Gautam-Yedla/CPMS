import type { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { supabase as defaultSupabase } from '../lib/supabase.js';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data: { user }, error } = await defaultSupabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Attach user to request
    (req as any).user = user;

    // Create an authenticated client to fetch role (respects RLS)
    const supabase = createClient(
      process.env.SUPABASE_URL!, 
      process.env.SUPABASE_ANON_KEY!, 
      { global: { headers: { Authorization: authHeader } } }
    );

    // Attach authenticated client to request
    (req as any).supabase = supabase;

    // FETCH GROUND TRUTH ROLE FROM DB
    // 1. Check user_roles junction table
    const { data: userRolesData, error: roleError } = await supabase
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', user.id);

    // 2. Fallback check profiles.role column
    const { data: profileRole } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    console.log(`[authMiddleware] DB Role Check for ${user.id}:`, JSON.stringify({ userRoles: userRolesData, roleError, profileRole }));

    let detectedRole = 'student';

    // Priority 1: user_roles table
    if (!roleError && userRolesData && userRolesData.length > 0) {
        // Find 'Admin' role if present
        const hasAdmin = userRolesData.some((ur: any) => {
            const rRoles = ur.roles as any;
            return rRoles?.name?.toLowerCase() === 'admin' || (Array.isArray(rRoles) && rRoles.some((r: any) => r?.name?.toLowerCase() === 'admin'));
        });
        
        if (hasAdmin) {
            detectedRole = 'admin';
        } else {
            // Otherwise just pick the first explicitly assigned role
            const firstRole = (userRolesData as any[])[0]?.roles as any;
            detectedRole = firstRole?.name || (Array.isArray(firstRole) ? firstRole[0]?.name : detectedRole);
        }
    } 
    // Priority 2: profiles column (if still student)
    else if (profileRole?.role) {
        detectedRole = profileRole.role;
    }
    // Priority 3: Fallback to metadata
    else {
        detectedRole = user.app_metadata?.role || user.user_metadata?.role || 'student';
    }

    (req as any).user.role = detectedRole;
    console.log(`[authMiddleware] Final Assigned Role: ${detectedRole}`);

    next();
  } catch (err) {
    console.error('Auth Middleware Error:', err);
    return res.status(500).json({ error: 'Internal server error during authentication' });
  }
};

export const adminMiddleware = async (req: any, res: Response, next: NextFunction) => {
  const role = req.user?.role;
  const is_admin = role?.toLowerCase() === 'admin';

  if (!is_admin) {
    return res.status(403).json({ 
      error: `Access denied. Admin role required. Current role: ${role}` 
    });
  }
  next();
};
