// localStorage so a page reload keeps you logged in.
const ACCESS_KEY = 'auth.access';
const REFRESH_KEY = 'auth.refresh';

export type Tokens = {
  access: string;
  refresh: string;
};

export const tokenStorage = {
  getAccess: () => localStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  set(tokens: Partial<Tokens>) {
    if (tokens.access) localStorage.setItem(ACCESS_KEY, tokens.access);
    if (tokens.refresh) localStorage.setItem(REFRESH_KEY, tokens.refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};
