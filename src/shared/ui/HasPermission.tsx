import React from 'react';
import { useAuthStore } from '../../modules/auth/presentation/useAuthStore';

const ROLE_PERMISSIONS: Record<string, string[]> = {
  Admin: [
    'create:variety',
    'view:inventory',
    'create:lot',
    'register:movement',
    'create:sale',
    'create:reservation',
    'pickup:reservation',
    'process:return',
    'view:sales'
  ],
  Vendedor: [
    'view:inventory',
    'create:sale',
    'create:reservation',
    'pickup:reservation',
    'view:sales'
  ]
};

export const checkPermission = (
  roles: string[] = [],
  permission: string,
  userPermissions?: string[]
): boolean => {
  if (roles.includes('Admin')) return true; // Admin has all permissions
  
  // 1. Check permissions dynamically from the backend list
  if (userPermissions && Array.isArray(userPermissions)) {
    return userPermissions.includes(permission);
  }

  // 2. Fallback to hardcoded list for backward compatibility
  return roles.some(role => {
    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.includes(permission);
  });
};

interface HasPermissionProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const HasPermission: React.FC<HasPermissionProps> = ({
  permission,
  children,
  fallback = null,
}) => {
  const user = useAuthStore((state) => state.user);

  if (!user) return <>{fallback}</>;

  const hasAccess = checkPermission(user.roles, permission, user.permissions);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};
