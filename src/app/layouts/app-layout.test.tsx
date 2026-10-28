import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { paths } from '../../common/config/paths.ts'
import { renderWithRouter } from '../../testing/render-with-router.tsx'
import { AppLayout } from './app-layout.tsx'

describe('AppLayout', () => {
  it('renders the nav and the current route', () => {
    renderWithRouter(
      [
        {
          element: <AppLayout />,
          children: [{ path: paths.chat, element: <p>chat content</p> }],
        },
      ],
      paths.chat,
    )
    expect(screen.getByRole('link', { name: 'Chat' })).toHaveClass('active')
    expect(screen.getByRole('link', { name: 'Ingestion' })).not.toHaveClass(
      'active',
    )
    expect(screen.getByText('chat content')).toBeInTheDocument()
  })
})
