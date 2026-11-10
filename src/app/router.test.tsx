import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { paths } from '../common/config/paths.ts';
import {
  adminUser,
  employeeUser,
  signedInAs,
} from '../testing/auth-fixtures.ts';
import { mockApi } from '../testing/mock-api.ts';
import { renderWithRouter } from '../testing/render-with-router.tsx';
import { routes } from './router.tsx';

const noDocuments = { 'GET /api/documents': { status: 200, body: [] } };

describe('main router', () => {
  it('redirects / to /login when signed out', () => {
    const router = renderWithRouter(routes, '/');
    expect(router.state.location.pathname).toBe('/login');
    expect(
      screen.getByRole('heading', { name: 'Sign in to DocumentsAI' }),
    ).toBeInTheDocument();
  });

  it('renders the login page at /login without the app header', () => {
    renderWithRouter(routes, '/login');
    expect(
      screen.getByRole('heading', { name: 'Sign in to DocumentsAI' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('redirects / to /chat when signed in', async () => {
    signedInAs(employeeUser);
    const router = renderWithRouter(routes, '/');
    await waitFor(() => expect(router.state.location.pathname).toBe('/chat'));
  });

  it('renders the chat page at /chat inside the app layout', async () => {
    signedInAs(employeeUser);
    renderWithRouter(routes, '/chat');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Chat' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('navigation', { name: 'Apps' }),
    ).toBeInTheDocument();
  });

  it('lets admins open ingestion', async () => {
    signedInAs(adminUser, noDocuments);
    renderWithRouter(routes, '/ingestion');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Ingestion' }),
    ).toBeInTheDocument();
  });

  it('shows employees the not allowed page at /ingestion', async () => {
    signedInAs(employeeUser);
    renderWithRouter(routes, '/ingestion');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Not allowed' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Upload' }),
    ).not.toBeInTheDocument();
  });

  it('sends you back to the page you asked for after signing in', async () => {
    mockApi({
      'POST /api/auth/login': {
        status: 200,
        body: { access: 'a', refresh: 'r' },
      },
      'GET /api/auth/me': { status: 200, body: adminUser },
      ...noDocuments,
    });
    const router = renderWithRouter(routes, '/ingestion');
    expect(router.state.location.pathname).toBe('/login');

    await userEvent.type(screen.getByLabelText('Work email'), adminUser.email);
    await userEvent.type(screen.getByLabelText('Password'), 'secret{Enter}');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Ingestion' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(paths.ingestion);
  });

  it('navigates between features from the side menu', async () => {
    signedInAs(adminUser, noDocuments);
    const router = renderWithRouter(routes, '/chat');
    await userEvent.click(await screen.findByRole('link', { name: 'Upload' }));
    expect(router.state.location.pathname).toBe('/ingestion');
  });

  it('renders the not-found page for unknown paths', async () => {
    signedInAs(employeeUser);
    renderWithRouter(routes, '/nope');
    expect(
      await screen.findByRole('heading', { name: 'Page not found' }),
    ).toBeInTheDocument();
  });
});
