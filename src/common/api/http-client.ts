import { tokenStorage } from './token-storage.ts';

const REFRESH_PATH = '/api/auth/refresh';

export class ApiError extends Error {
  readonly status: number;

  // 0 = never reached the server
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  // false for public endpoints (login)
  auth?: boolean;
};

const expiredListeners = new Set<() => void>();
let refreshing: Promise<string | null> | null = null;

// Runs when refresh fails and the user has to log in again.
export function onSessionExpired(listener: () => void) {
  expiredListeners.add(listener);
  return () => {
    expiredListeners.delete(listener);
  };
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const useAuth = options.auth ?? true;
  let response = await send(
    path,
    options,
    useAuth ? tokenStorage.getAccess() : null,
  );

  if (response.status === 401 && useAuth) {
    const access = await refreshAccessToken();
    if (access) {
      response = await send(path, options, access);
    }
    if (response.status === 401) {
      tokenStorage.clear();
      expiredListeners.forEach((listener) => listener());
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, await readDetail(response));
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

async function send(
  path: string,
  options: RequestOptions,
  token: string | null,
) {
  const headers: Record<string, string> = { Accept: 'application/json' };
  let body: BodyInit | undefined;

  // Let the browser set the content type for FormData (uploads).
  if (options.body instanceof FormData) {
    body = options.body;
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    return await fetch(path, {
      method: options.method ?? 'GET',
      headers,
      body,
    });
  } catch {
    throw new ApiError(0, 'Could not reach the server.');
  }
}

function refreshAccessToken(): Promise<string | null> {
  const refresh = tokenStorage.getRefresh();
  if (!refresh) {
    return Promise.resolve(null);
  }

  // If a few requests 401 at once they share one refresh.
  refreshing ??= send(REFRESH_PATH, { method: 'POST', body: { refresh } }, null)
    .then(async (response) => {
      if (!response.ok) return null;
      const { access } = (await response.json()) as { access: string };
      tokenStorage.set({ access });
      return access;
    })
    .catch(() => null)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

async function readDetail(response: Response) {
  try {
    const data = (await response.json()) as { detail?: unknown };
    if (typeof data.detail === 'string') return data.detail;
  } catch {
    // not json
  }
  return response.statusText || 'Request failed.';
}
