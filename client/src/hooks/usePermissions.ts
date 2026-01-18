import { useAuth } from './useAuth';

export function usePermissions() {
  const { user } = useAuth();

  const isAdmin = () => {
    const role = user?.role?.toString().toUpperCase();
    return role === 'ADMIN' ||
      role === 'SYSTEM_ADMIN' ||
      role === 'HR_ADMIN' ||
      role === 'GENERAL_MANAGER' ||
      role === 'TERRITORY_MANAGER';
  };

  const isManager = () => {
    const role = user?.role?.toString().toUpperCase();
    return isAdmin() || role === 'MANAGER' || role === 'TEAM_LEAD';
  };

  const canViewResource = (resource: string) => {
    // Basic resource-based permissions
    if (!user) return false;

    // Admins can view everything
    if (isAdmin()) return true;

    // Managers can view most resources except admin-only ones
    if (isManager()) {
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
