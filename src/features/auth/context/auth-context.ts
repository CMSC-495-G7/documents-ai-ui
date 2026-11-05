import { createContext } from 'react';
import type { User } from '../types.ts';

export type AuthStatus = 'loading' | 'signed-out' | 'signed-in';

export type AuthState = {
  status: AuthStatus;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
};

export const AuthContext = createContext<AuthState | null>(null);
