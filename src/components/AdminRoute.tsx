import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/MockAuthContext';

interface AdminRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'manager';
}

const hasRequiredRole = (userRoles: string[], requiredRole: string): boolean => {
  const roleHierarchy: { [key: string]: number } = {
    'user': 1,
    'staff': 2,
    'nurse': 3,
    'doctor': 4,
    'manager': 5,
    'admin': 6
  };

  const requiredRoleLevel = roleHierarchy[requiredRole] || 0;
  const userMaxRoleLevel = Math.max(...userRoles.map(role => roleHierarchy[role] || 0));

  return userMaxRoleLevel >= requiredRoleLevel;
};

export default function AdminRoute({ children, requiredRole = 'admin' }: AdminRouteProps) {
  const { user, isAuthenticated } = useAuth();

  // If not authenticated, redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  // If user doesn't have required role, redirect to main page
  if (!hasRequiredRole(user.roles || [], requiredRole)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
