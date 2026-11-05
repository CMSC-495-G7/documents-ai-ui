// Same shape as /api/auth/me.
export type Role = 'admin' | 'employee';

export type Workspace = {
  id: number;
  name: string;
  slug: string;
};

export type User = {
  id: number;
  email: string;
  role: Role;
  workspace: Workspace;
};
