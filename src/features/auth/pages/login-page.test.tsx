import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { paths } from '../../../common/config/paths.ts'
import { renderWithRouter } from '../../../testing/render-with-router.tsx'
import { authRoutes } from '../auth-routes.tsx'

function renderLogin() {
  return renderWithRouter(
    [
      { path: paths.login, children: authRoutes },
      { path: paths.chat, element: null },
    ],
    paths.login,
  )
}

function expectEmptyFieldsError() {
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Both fields are required.',
  )
  expect(screen.getByLabelText('Work email')).toHaveAttribute(
    'aria-invalid',
    'true',
  )
  expect(screen.getByLabelText('Password')).toHaveAttribute(
    'aria-invalid',
    'true',
  )
  expect(screen.getByLabelText('Work email')).toHaveAccessibleDescription(
    'Enter your email and password.',
  )
}

describe('LoginPage', () => {
  it('shows no error before submitting', () => {
    renderLogin()
    expect(
      screen.getByRole('heading', { name: 'Sign in to DocumentsAI' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows the error when Sign in is clicked with empty fields', async () => {
    const router = renderLogin()
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expectEmptyFieldsError()
    expect(screen.getByLabelText('Work email')).toHaveFocus()
    expect(router.state.location.pathname).toBe(paths.login)
  })

  it('shows the error when Enter is pressed with empty fields', async () => {
    renderLogin()
    await userEvent.click(screen.getByLabelText('Work email'))
    await userEvent.keyboard('{Enter}')
    expectEmptyFieldsError()
  })

  it('only flags the field that is still empty', async () => {
    renderLogin()
    await userEvent.type(screen.getByLabelText('Work email'), 'a@acme.example')
    await userEvent.keyboard('{Enter}')
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByLabelText('Work email')).toHaveAttribute(
      'aria-invalid',
      'false',
    )
    expect(screen.getByLabelText('Password')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    expect(screen.getByLabelText('Password')).toHaveFocus()
  })

  it('clears the error once the user types', async () => {
    renderLogin()
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    await userEvent.type(screen.getByLabelText('Work email'), 'a')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('goes to chat when both fields are filled in', async () => {
    const router = renderLogin()
    await userEvent.type(screen.getByLabelText('Work email'), 'a@acme.example')
    await userEvent.type(screen.getByLabelText('Password'), 'secret{Enter}')
    await waitFor(() => expect(router.state.location.pathname).toBe(paths.chat))
  })

  it('toggles password visibility', async () => {
    renderLogin()
    expect(screen.getByLabelText('Password')).toHaveAttribute(
      'type',
      'password',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Show password' }))
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text')
  })
})
