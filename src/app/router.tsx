import { Navigate, type RouteObject } from 'react-router-dom';
import { paths } from '../common/config/paths.ts';
import { authRoutes } from '../features/auth/auth-routes.tsx';
import { RequireAuth } from '../features/auth/components/require-auth.tsx';
import { RequireRole } from '../features/auth/components/require-role.tsx';
import { chatRoutes } from '../features/chat/chat-routes.tsx';
import { ingestionRoutes } from '../features/ingestion/ingestion-routes.tsx';
import { AppLayout } from './layouts/app-layout.tsx';
import { NotAllowedPage } from './pages/not-allowed-page.tsx';
import { NotFoundPage } from './pages/not-found-page.tsx';

// The main router: mounts each feature's sub-router at its base path and
// picks the layout and guards around it. Feature screens live in the sub-routers.
export const routes: RouteObject[] = [
  { path: paths.login, children: authRoutes },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to={paths.chat} replace /> },
          { path: paths.chat, children: chatRoutes },
          {
            element: <RequireRole role="admin" fallback={<NotAllowedPage />} />,
            children: [{ path: paths.ingestion, children: ingestionRoutes }],
          },
          {
            path: '*',
            element: <NotFoundPage />,
            handle: { crumb: 'Page not found' },
          },
        ],
      },
    ],
  },
];
