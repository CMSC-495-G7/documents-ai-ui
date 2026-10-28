import { Navigate, type RouteObject } from 'react-router-dom'
import { paths } from '../common/config/paths.ts'
import { authRoutes } from '../features/auth/auth-routes.tsx'
import { chatRoutes } from '../features/chat/chat-routes.tsx'
import { ingestionRoutes } from '../features/ingestion/ingestion-routes.tsx'
import { AppLayout } from './layouts/app-layout.tsx'
import { NotFoundPage } from './pages/not-found-page.tsx'

// The main router: mounts each feature's sub-router at its base path and
// picks the layout around it. Feature screens live in the sub-routers.
export const routes: RouteObject[] = [
  { path: paths.login, children: authRoutes },
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to={paths.login} replace /> },
      { path: paths.chat, children: chatRoutes },
      { path: paths.ingestion, children: ingestionRoutes },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
