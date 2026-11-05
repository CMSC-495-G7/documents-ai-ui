import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { paths } from '../../common/config/paths.ts';
import { useAuth } from '../../features/auth/context/use-auth.ts';

export function AppLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    navigate(paths.login, { replace: true });
  };

  return (
    <>
      <header className="app-header">
        <strong>Documents AI</strong>
        <nav>
          <NavLink to={paths.chat}>Chat</NavLink>
          {user?.role === 'admin' && (
            <NavLink to={paths.ingestion}>Ingestion</NavLink>
          )}
        </nav>
        {user && (
          <div className="app-header-user">
            <span>{user.email}</span>
            <span className="app-header-role">{user.role}</span>
            <button onClick={handleSignOut}>Sign out</button>
          </div>
        )}
      </header>
      <main>
        <Outlet />
      </main>
    </>
  );
}
