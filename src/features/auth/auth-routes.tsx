import type { RouteObject } from 'react-router-dom'
import { LoginPage } from './pages/login-page.tsx'

export const authRoutes: RouteObject[] = [
  { index: true, element: <LoginPage /> },
]
