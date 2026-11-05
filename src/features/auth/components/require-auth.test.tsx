import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { paths } from '../../../common/config/paths.ts';
import { employeeUser, signedInAs } from '../../../testing/auth-fixtures.ts';
import { mockApi } from '../../../testing/mock-api.ts';
import { renderWithRouter } from '../../../testing/render-with-router.tsx';
import { RequireAuth } from './require-auth.tsx';

function renderPrivatePage() {
  return renderWithRouter(
    [
      {
        element: <RequireAuth />,
        children: [{ path: '/private', element: <p>private content</p> }],
      },
      { path: paths.login, element: <p>login page</p> },
    ],
    '/private',
  );
}

describe('RequireAuth', () => {
  it('sends signed-out users to login', () => {
    const router = renderPrivatePage();
    expect(router.state.location.pathname).toBe(paths.login);
    expect(router.state.location.state).toMatchObject({
      from: { pathname: '/private' },
    });
  });

  it('shows loading while the saved session is checked', async () => {
    signedInAs(employeeUser);
    renderPrivatePage();
    expect(screen.getByRole('status')).toHaveTextContent('Loading');
    expect(await screen.findByText('private content')).toBeInTheDocument();
  });

  it('sends users to login when the saved session has expired', async () => {
    mockApi({
      'GET /api/auth/me': { status: 401 },
      'POST /api/auth/refresh': { status: 401 },
    });
    localStorage.setItem('auth.refresh', 'expired');
    const router = renderPrivatePage();
    await waitFor(() =>
      expect(router.state.location.pathname).toBe(paths.login),
    );
  });
});
