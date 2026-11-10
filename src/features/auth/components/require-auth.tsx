import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { paths } from '../../../common/config/paths.ts';
import { useAuth } from '../context/use-auth.ts';

// Guard for logged in routes. `from` is so login can send you back.
export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <p role="status" className="p-12 text-center text-ink-soft">
        Loading…
      </p>
    );
  }
  if (status === 'signed-out') {
    return <Navigate to={paths.login} replace state={{ from: location }} />;
  }
  return <Outlet />;
}
