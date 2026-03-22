import React, { ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { IRootState } from '@app/appReducer';

interface PermissionGuardProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * PermissionGuard component to conditionally render content based on user permissions.
 * It checks both the 'role' (admins get all) and specific 'permissions' provided by the auth state.
 */
const PermissionGuard: React.FC<PermissionGuardProps> = ({ 
  permission, 
  children, 
  fallback = null 
}) => {
  const { user } = useSelector((state: IRootState) => state.app.auth);

  if (!user) return null;

  // Admin bypass
  if (user.role?.toLowerCase() === 'admin') {
    return <>{children}</>;
  }

  // Check if permission exists in user's permissions array
  // Note: We need to ensure the auth state includes a 'permissions' array.
  const hasPermission = user.permissions?.some((p: any) => p.name === permission);

  if (hasPermission) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

export default PermissionGuard;
