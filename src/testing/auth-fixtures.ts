import { tokenStorage } from '../common/api/token-storage.ts';
import type { User } from '../features/auth/types.ts';
import { mockApi } from './mock-api.ts';

const workspace = { id: 1, name: 'Engineering', slug: 'engineering' };

export const adminUser: User = {
  id: 1,
  email: 'admin@acme.example',
  role: 'admin',
  workspace,
};

export const employeeUser: User = {
  id: 2,
  email: 'employee@acme.example',
  role: 'employee',
  workspace,
};

// Call before render. Extra routes get mocked too.
export function signedInAs(
  user: User,
  routes: Parameters<typeof mockApi>[0] = {},
) {
  tokenStorage.set({ access: 'access-token', refresh: 'refresh-token' });
  return mockApi({
    'GET /api/auth/me': { status: 200, body: user },
    ...routes,
  });
}
