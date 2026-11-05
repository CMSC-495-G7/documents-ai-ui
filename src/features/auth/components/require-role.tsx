import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/use-auth.ts';
import type { Role } from '../types.ts';

type RequireRoleProps = {
  role: Role;
  // Shown when the role doesn't match.
  fallback: ReactNode;
};

// Put this inside RequireAuth so the user is loaded.
export function RequireRole({ role, fallback }: RequireRoleProps) {
  const { user } = useAuth();
  return user?.role === role ? <Outlet /> : <>{fallback}</>;
}
