import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { paths } from '../../common/config/paths.ts';
import { renderWithRouter } from '../../testing/render-with-router.tsx';
import { NotAllowedPage } from './not-allowed-page.tsx';

describe('NotAllowedPage', () => {
  it('explains the page is admin only and links back to chat', async () => {
    const router = renderWithRouter(
      [
        { path: '/admin-page', element: <NotAllowedPage /> },
        { path: paths.chat, element: null },
      ],
      '/admin-page',
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'Not allowed' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/only workspace admins/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: 'Back to chat' }));
    expect(router.state.location.pathname).toBe(paths.chat);
  });
});
