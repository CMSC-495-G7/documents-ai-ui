import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { routes } from './routes.tsx'

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(<RouterProvider router={router} />)
  return router
}

describe('routes', () => {
  it('renders the home page at /', () => {
    renderAt('/')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Documents AI' }),
    ).toBeInTheDocument()
  })

  it('renders the not-found page for unknown paths', () => {
    renderAt('/nope')
    expect(
      screen.getByRole('heading', { name: 'Page not found' }),
    ).toBeInTheDocument()
  })

  it('navigates back home from the not-found page', async () => {
    const router = renderAt('/nope')
    await userEvent.click(screen.getByRole('link', { name: 'Back to home' }))
    expect(router.state.location.pathname).toBe('/')
  })
})
