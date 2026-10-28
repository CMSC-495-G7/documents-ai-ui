import type { RouteObject } from 'react-router-dom'
import { IngestionPage } from './pages/ingestion-page.tsx'

export const ingestionRoutes: RouteObject[] = [
  { index: true, element: <IngestionPage /> },
]
