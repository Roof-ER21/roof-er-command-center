import { useAuth } from './useAuth';

export function usePermissions() {
  const { user } = useAuth();

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const isManager = () => {
    return user?.role === 'admin' || user?.role === 'manager';
  };

  const canViewResource = (resource: string) => {
    // Basic resource-based permissions
    if (!user) return false;

    // Admins can view everything
    if (user.role === 'admin') return true;

    // Managers can view most resources except admin-only ones
    if (user.role === 'manager') {
      const adminOnly = ['system-settings', 'user-management'];
      return !adminOnly.includes(resource);
    }

    // Regular employees can view their own resources
    const employeeResources = ['profile', 'pto', 'documents', 'reviews'];
    return employeeResources.includes(resource);
  };

  return {
    isAdmin,
    isManager,
    canViewResource,
  };
}
