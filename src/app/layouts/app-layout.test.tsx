import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { tokenStorage } from '../../common/api/token-storage.ts';
import { paths } from '../../common/config/paths.ts';
import {
  adminUser,
  employeeUser,
  signedInAs,
} from '../../testing/auth-fixtures.ts';
import { renderWithRouter } from '../../testing/render-with-router.tsx';
import { AppLayout } from './app-layout.tsx';

function renderLayout() {
  return renderWithRouter(
    [
      {
        element: <AppLayout />,
        children: [{ path: paths.chat, element: <p>chat content</p> }],
      },
      { path: paths.login, element: <p>login page</p> },
    ],
    paths.chat,
  );
}

describe('AppLayout', () => {
  it('renders the nav, the signed-in user and the current route', async () => {
    signedInAs(adminUser);
    renderLayout();
    expect(await screen.findByText('admin@acme.example')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Chat' })).toHaveClass('active');
    expect(screen.getByRole('link', { name: 'Ingestion' })).not.toHaveClass(
      'active',
    );
    expect(screen.getByText('chat content')).toBeInTheDocument();
  });

  it('hides admin links from employees', async () => {
    signedInAs(employeeUser);
    renderLayout();
    expect(
      await screen.findByText('employee@acme.example'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Ingestion' }),
    ).not.toBeInTheDocument();
  });

  it('signs out and goes to login', async () => {
    signedInAs(employeeUser);
    const router = renderLayout();
    await userEvent.click(
      await screen.findByRole('button', { name: 'Sign out' }),
    );
    await waitFor(() =>
      expect(router.state.location.pathname).toBe(paths.login),
    );
    expect(tokenStorage.getRefresh()).toBeNull();
  });
});
