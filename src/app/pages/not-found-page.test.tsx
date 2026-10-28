import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { paths } from '../../common/config/paths.ts'
import { renderWithRouter } from '../../testing/render-with-router.tsx'
import { NotFoundPage } from './not-found-page.tsx'

describe('NotFoundPage', () => {
  it('links back to chat', async () => {
    const router = renderWithRouter(
      [
        { path: '*', element: <NotFoundPage /> },
        { path: paths.chat, element: null },
      ],
      '/nope',
    )
    expect(
      screen.getByRole('heading', { name: 'Page not found' }),
    ).toBeInTheDocument()
    await userEvent.click(screen.getByRole('link', { name: 'Back to chat' }))
    expect(router.state.location.pathname).toBe(paths.chat)
  })
})
