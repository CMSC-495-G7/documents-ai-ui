import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { onSessionExpired } from '../../../common/api/http-client.ts';
import { tokenStorage } from '../../../common/api/token-storage.ts';
import { getCurrentUser } from '../api/get-current-user.ts';
import { signIn as requestTokens } from '../api/sign-in.ts';
import type { User } from '../types.ts';
import { AuthContext, type AuthStatus } from './auth-context.ts';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // Saved session, wait for /me before we know who it is.
  const [status, setStatus] = useState<AuthStatus>(() =>
    tokenStorage.getRefresh() ? 'loading' : 'signed-out',
  );

  useEffect(() => {
    if (!tokenStorage.getRefresh()) return;
    let cancelled = false;
    getCurrentUser()
      .then((me) => {
        if (cancelled) return;
        setUser(me);
        setStatus('signed-in');
      })
      .catch(() => {
        if (!cancelled) setStatus('signed-out');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(
    () =>
      onSessionExpired(() => {
        setUser(null);
        setStatus('signed-out');
      }),
    [],
  );

  const signIn = useCallback(async (email: string, password: string) => {
    tokenStorage.set(await requestTokens({ email, password }));
    setUser(await getCurrentUser());
    setStatus('signed-in');
  }, []);

  const signOut = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
    setStatus('signed-out');
  }, []);

  const value = useMemo(
    () => ({ status, user, signIn, signOut }),
    [status, user, signIn, signOut],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
