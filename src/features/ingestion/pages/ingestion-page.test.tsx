import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { paths } from '../../../common/config/paths.ts'
import { renderWithRouter } from '../../../testing/render-with-router.tsx'
import { ingestionRoutes } from '../ingestion-routes.tsx'

describe('IngestionPage', () => {
  it('renders at the ingestion base path', () => {
    renderWithRouter(
      [{ path: paths.ingestion, children: ingestionRoutes }],
      paths.ingestion,
    )
    expect(
      screen.getByRole('heading', { level: 1, name: 'Ingestion' }),
    ).toBeInTheDocument()
  })
})
