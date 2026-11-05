import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  adminUser,
  employeeUser,
  signedInAs,
} from '../../../testing/auth-fixtures.ts';
import { renderWithRouter } from '../../../testing/render-with-router.tsx';
import type { User } from '../types.ts';
import { RequireAuth } from './require-auth.tsx';
import { RequireRole } from './require-role.tsx';

function renderAdminPageAs(user: User) {
  signedInAs(user);
  renderWithRouter(
    [
      {
        element: <RequireAuth />,
        children: [
          {
            element: <RequireRole role="admin" fallback={<p>not allowed</p>} />,
            children: [{ path: '/admin', element: <p>admin content</p> }],
          },
        ],
      },
    ],
    '/admin',
  );
}

describe('RequireRole', () => {
  it('lets admins through', async () => {
    renderAdminPageAs(adminUser);
    expect(await screen.findByText('admin content')).toBeInTheDocument();
  });

  it('shows the fallback to other roles', async () => {
    renderAdminPageAs(employeeUser);
    expect(await screen.findByText('not allowed')).toBeInTheDocument();
    expect(screen.queryByText('admin content')).not.toBeInTheDocument();
  });
});
