import type { ReactNode } from 'react';
import { AuthProvider } from '../features/auth/context/auth-provider.tsx';

// All global providers go here.
export function AppProvider({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
