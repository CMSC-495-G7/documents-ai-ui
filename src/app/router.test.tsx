import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderWithRouter } from '../testing/render-with-router.tsx'
import { routes } from './router.tsx'

describe('main router', () => {
  it('redirects / to /login', () => {
    const router = renderWithRouter(routes, '/')
    expect(router.state.location.pathname).toBe('/login')
    expect(
      screen.getByRole('heading', { name: 'Sign in to DocumentsAI' }),
    ).toBeInTheDocument()
  })

  it('renders the login page at /login without the app header', () => {
    renderWithRouter(routes, '/login')
    expect(
      screen.getByRole('heading', { name: 'Sign in to DocumentsAI' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  it('renders the chat page at /chat inside the app layout', () => {
    renderWithRouter(routes, '/chat')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Chat' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('renders the ingestion page at /ingestion inside the app layout', () => {
    renderWithRouter(routes, '/ingestion')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Ingestion' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('navigates between features from the nav', async () => {
    const router = renderWithRouter(routes, '/chat')
    await userEvent.click(screen.getByRole('link', { name: 'Ingestion' }))
    expect(router.state.location.pathname).toBe('/ingestion')
  })

  it('renders the not-found page for unknown paths', () => {
    renderWithRouter(routes, '/nope')
    expect(
      screen.getByRole('heading', { name: 'Page not found' }),
    ).toBeInTheDocument()
  })
})
