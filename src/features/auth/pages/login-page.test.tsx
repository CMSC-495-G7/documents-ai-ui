import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { tokenStorage } from '../../../common/api/token-storage.ts';
import { paths } from '../../../common/config/paths.ts';
import { employeeUser, signedInAs } from '../../../testing/auth-fixtures.ts';
import { jsonResponse, mockApi } from '../../../testing/mock-api.ts';
import { renderWithRouter } from '../../../testing/render-with-router.tsx';
import { authRoutes } from '../auth-routes.tsx';

const tokens = { access: 'access-token', refresh: 'refresh-token' };

function renderLogin() {
  return renderWithRouter(
    [
      { path: paths.login, children: authRoutes },
      { path: paths.chat, element: null },
    ],
    paths.login,
  );
}

async function fillAndSubmit(password = 'secret') {
  await userEvent.type(screen.getByLabelText('Work email'), 'a@acme.example');
  await userEvent.type(screen.getByLabelText('Password'), `${password}{Enter}`);
}

function expectEmptyFieldsError() {
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Both fields are required.',
  );
  expect(screen.getByLabelText('Work email')).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  expect(screen.getByLabelText('Password')).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  expect(screen.getByLabelText('Work email')).toHaveAccessibleDescription(
    'Enter your email and password.',
  );
}

describe('LoginPage', () => {
  it('shows no error before submitting', () => {
    renderLogin();
    expect(
      screen.getByRole('heading', { name: 'Sign in to DocumentsAI' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows the error when Sign in is clicked with empty fields', async () => {
    const router = renderLogin();
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expectEmptyFieldsError();
    expect(screen.getByLabelText('Work email')).toHaveFocus();
    expect(router.state.location.pathname).toBe(paths.login);
  });

  it('shows the error when Enter is pressed with empty fields', async () => {
    renderLogin();
    await userEvent.click(screen.getByLabelText('Work email'));
    await userEvent.keyboard('{Enter}');
    expectEmptyFieldsError();
  });

  it('only flags the field that is still empty', async () => {
    renderLogin();
    await userEvent.type(screen.getByLabelText('Work email'), 'a@acme.example');
    await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByLabelText('Work email')).toHaveAttribute(
      'aria-invalid',
      'false',
    );
    expect(screen.getByLabelText('Password')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.getByLabelText('Password')).toHaveFocus();
  });

  it('clears the error once the user types', async () => {
    renderLogin();
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    await userEvent.type(screen.getByLabelText('Work email'), 'a');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('signs in, saves the tokens and goes to chat', async () => {
    mockApi({
      'POST /api/auth/login': { status: 200, body: tokens },
      'GET /api/auth/me': { status: 200, body: employeeUser },
    });
    const router = renderLogin();
    await fillAndSubmit();
    await waitFor(() =>
      expect(router.state.location.pathname).toBe(paths.chat),
    );
    expect(tokenStorage.getRefresh()).toBe('refresh-token');
  });

  it('shows a clear message for a wrong password', async () => {
    mockApi({
      'POST /api/auth/login': {
        status: 401,
        body: { detail: 'Incorrect email or password.' },
      },
    });
    const router = renderLogin();
    await fillAndSubmit('wrong');
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Incorrect email or password.',
    );
    expect(screen.getByLabelText('Password')).toHaveFocus();
    expect(router.state.location.pathname).toBe(paths.login);
  });

  it('shows a server error when the API fails', async () => {
    mockApi({ 'POST /api/auth/login': { status: 500 } });
    renderLogin();
    await fillAndSubmit();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      "We couldn't sign you in right now.",
    );
  });

  it('shows the same server error when the API is down', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
    renderLogin();
    await fillAndSubmit();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      "We couldn't sign you in right now.",
    );
  });

  it('disables the button while signing in', async () => {
    let finish = () => {};
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            finish = () => resolve(jsonResponse({ status: 401 }));
          }),
      ),
    );
    renderLogin();
    await fillAndSubmit();

    expect(screen.getByRole('button', { name: 'Signing in…' })).toBeDisabled();
    finish();
    expect(
      await screen.findByRole('button', { name: 'Sign in' }),
    ).toBeEnabled();
  });

  it('skips the form when already signed in', async () => {
    signedInAs(employeeUser);
    const router = renderLogin();
    await waitFor(() =>
      expect(router.state.location.pathname).toBe(paths.chat),
    );
  });

  it('toggles password visibility', async () => {
    renderLogin();
    expect(screen.getByLabelText('Password')).toHaveAttribute(
      'type',
      'password',
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Show password' }),
    );
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text');
  });
});
