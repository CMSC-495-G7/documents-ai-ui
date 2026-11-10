import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { tokenStorage } from '../../common/api/token-storage.ts';
import { paths } from '../../common/config/paths.ts';
import { TopBarActions } from '../../common/top-bar/top-bar-slot.tsx';
import {
  adminUser,
  employeeUser,
  signedInAs,
} from '../../testing/auth-fixtures.ts';
import { renderWithRouter } from '../../testing/render-with-router.tsx';
import { AppLayout } from './app-layout.tsx';

function renderLayout(page = <p>chat content</p>) {
  return renderWithRouter(
    [
      {
        element: <AppLayout />,
        children: [
          { path: paths.chat, element: page },
          { path: paths.ingestion, element: <p>upload content</p> },
        ],
      },
      { path: paths.login, element: <p>login page</p> },
    ],
    paths.chat,
  );
}

function sideMenu() {
  return screen.getByRole('navigation', { name: 'Apps' });
}

describe('AppLayout', () => {
  it('wraps the page in the side menu and top bar', async () => {
    signedInAs(adminUser);
    renderLayout();

    expect(await screen.findByText('chat content')).toBeInTheDocument();
    expect(
      within(sideMenu()).getByRole('link', { name: 'Chat' }),
    ).toHaveAttribute('aria-current', 'page');
    expect(
      within(sideMenu()).getByRole('link', { name: 'Upload' }),
    ).not.toHaveAttribute('aria-current');

    const breadcrumb = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(within(breadcrumb).getByText('Chat')).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  // jsdom has no layout, so check the classes that keep the side menu full height.
  it('scrolls inside main so the side menu always reaches the bottom', async () => {
    signedInAs(adminUser);
    renderLayout();
    await screen.findByText('chat content');

    expect(screen.getByTestId('app-shell')).toHaveClass(
      'h-dvh',
      'overflow-hidden',
    );
    expect(screen.getByRole('main')).toHaveClass(
      'relative',
      'min-h-0',
      'overflow-y-auto',
    );
  });

  it('moves between pages from the side menu', async () => {
    signedInAs(adminUser);
    const router = renderLayout();
    await screen.findByText('chat content');

    await userEvent.click(
      within(sideMenu()).getByRole('link', { name: 'Upload' }),
    );
    expect(router.state.location.pathname).toBe(paths.ingestion);
    expect(screen.getByText('upload content')).toBeInTheDocument();
  });

  it('hides admin pages from employees', async () => {
    signedInAs(employeeUser);
    renderLayout();
    await screen.findByText('chat content');

    expect(
      within(sideMenu()).queryByRole('link', { name: 'Upload' }),
    ).not.toBeInTheDocument();
  });

  it('shows the signed-in user in the account menu', async () => {
    signedInAs(adminUser);
    renderLayout();

    await userEvent.click(
      await screen.findByRole('button', {
        name: 'Account: admin@acme.example',
      }),
    );
    expect(screen.getByText('Admin · Engineering')).toBeInTheDocument();
  });

  it('signs out from the account menu and goes to login', async () => {
    signedInAs(employeeUser);
    const router = renderLayout();

    await userEvent.click(
      await screen.findByRole('button', {
        name: 'Account: employee@acme.example',
      }),
    );
    await userEvent.click(screen.getByRole('menuitem', { name: /Sign out/ }));

    await waitFor(() =>
      expect(router.state.location.pathname).toBe(paths.login),
    );
    expect(tokenStorage.getRefresh()).toBeNull();
  });

  it('lets a page add its own buttons to the top bar', async () => {
    signedInAs(adminUser);
    renderLayout(
      <TopBarActions>
        <button type="button">New chat</button>
      </TopBarActions>,
    );

    const button = await screen.findByRole('button', { name: 'New chat' });
    expect(button.closest('header')).toBeInTheDocument();
  });
});
