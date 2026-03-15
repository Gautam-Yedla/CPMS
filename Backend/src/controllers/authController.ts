import type { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const getSupabase = (req: Request) => {
  if (!req.headers.authorization) {
    return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
  }
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: req.headers.authorization } }
  });
};

// --- Roles ---

export const getRoles = async (req: Request, res: Response) => {
  try {
    const { data, error } = await getSupabase(req).from('roles').select('*').order('name');
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createRole = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const { data, error } = await getSupabase(req).from('roles').insert({ name, description }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const { data, error } = await getSupabase(req).from('roles').update({ name, description }).eq('id', id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Check if system role
    const { data: role } = await getSupabase(req).from('roles').select('is_system').eq('id', id).single();
    if (role?.is_system) {
      return res.status(403).json({ error: 'Cannot delete system roles' });
    }

    const { error } = await getSupabase(req).from('roles').delete().eq('id', id);
    if (error) throw error;
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// --- Permissions ---

export const getPermissions = async (req: Request, res: Response) => {
  try {
    const { data, error } = await getSupabase(req).from('permissions').select('*').order('module').order('name');
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createPermission = async (req: Request, res: Response) => {
  try {
    const { name, module, description, scope } = req.body;
    const { data, error } = await getSupabase(req).from('permissions').insert({ name, module, description, scope }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// --- Role Permissions ---

export const getRolePermissions = async (req: Request, res: Response) => {
  try {
    const { roleId } = req.params;
    const { data, error } = await getSupabase(req)
      .from('role_permissions')
      .select('permission_id, permissions(*)')
      .eq('role_id', roleId);
    
    if (error) throw error;
    res.json(data.map((item: any) => item.permissions));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const assignPermissionToRole = async (req: Request, res: Response) => {
  try {
    const { roleId } = req.params;
    const { permissionId } = req.body;
    const { error } = await getSupabase(req).from('role_permissions').insert({ role_id: roleId, permission_id: permissionId });
    if (error) throw error;
    res.status(201).json({ message: 'Permission assigned' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const removePermissionFromRole = async (req: Request, res: Response) => {
  try {
    const { roleId, permissionId } = req.params;
    const { error } = await getSupabase(req).from('role_permissions').delete().match({ role_id: roleId, permission_id: permissionId });
    if (error) throw error;
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// --- User Roles ---

export const getUserRoles = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { data, error } = await getSupabase(req)
      .from('user_roles')
      .select('role_id, roles(*)')
      .eq('user_id', userId);

    if (error) throw error;
    res.json(data.map((item: any) => item.roles));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const assignRoleToUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { roleId } = req.body;
    const { error } = await getSupabase(req).from('user_roles').insert({ user_id: userId, role_id: roleId });
    if (error) throw error;
    res.status(201).json({ message: 'Role assigned' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const removeRoleFromUser = async (req: Request, res: Response) => {
  try {
    const { userId, roleId } = req.params;
    const { error } = await getSupabase(req).from('user_roles').delete().match({ user_id: userId, role_id: roleId });
    if (error) throw error;
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
          global: { headers: { Authorization: req.headers.authorization! } }
        });

        // Fetch profiles
        const { data: profiles, error: profileError } = await getSupabase(req).from('profiles').select('*');
        if (profileError) throw profileError;

        // Fetch all user roles with role details
        const { data: userRoles, error: roleError } = await supabase
            .from('user_roles')
            .select('user_id, roles(name)');
            
        if (roleError) throw roleError;

        // Merge roles into profiles
        const profilesWithRoles = profiles.map(profile => {
            // Find roles for this user
            const roles = userRoles
                ?.filter((ur: any) => ur.user_id === profile.id)
                .map((ur: any) => ({ roles: ur.roles })) || [];
            
            return {
                ...profile,
                roles: roles
            };
        });

        res.json(profilesWithRoles);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

export const updateUser = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { full_name, department, role_id } = req.body;

        // 1. Update basic profile
        const { error: profileError } = await getSupabase(req)
            .from('profiles')
            .update({ full_name, department })
            .eq('id', userId);

        if (profileError) throw profileError;

        // 2. Update role if provided
        if (role_id) {
            // Check current role
            const { data: userRoles } = await getSupabase(req).from('user_roles').select('*').eq('user_id', userId);

            if (userRoles && userRoles.length > 0) {
                // Update existing
                await getSupabase(req).from('user_roles').update({ role_id }).eq('user_id', userId);
            } else {
                // Insert new
                await getSupabase(req).from('user_roles').insert({ user_id: userId, role_id });
            }
        }

        res.json({ message: 'User updated successfully' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}
