import { useContext } from 'react';
import { AuthContext } from './auth-context.ts';

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) {
    throw new Error('useAuth needs to be inside <AuthProvider>.');
  }
  return auth;
}
