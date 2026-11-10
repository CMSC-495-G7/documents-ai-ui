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
  // Uploads only. Called with 0-100 while the body is sent.
  onUploadProgress?: (percent: number) => void;
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
  // Only these two, both fetch and XHR can send them.
  let body: FormData | string | undefined;

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

  const method = options.method ?? 'GET';
  if (options.onUploadProgress) {
    return sendWithProgress(
      path,
      method,
      headers,
      body,
      options.onUploadProgress,
    );
  }

  try {
    return await fetch(path, { method, headers, body });
  } catch {
    throw new ApiError(0, 'Could not reach the server.');
  }
}

// fetch can't report upload progress, XMLHttpRequest can.
function sendWithProgress(
  path: string,
  method: string,
  headers: Record<string, string>,
  body: FormData | string | undefined,
  onProgress: (percent: number) => void,
) {
  return new Promise<Response>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, path);
    for (const [name, value] of Object.entries(headers)) {
      xhr.setRequestHeader(name, value);
    }
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    // Same Response object fetch gives, so the rest of apiRequest doesn't care.
    xhr.onload = () =>
      resolve(
        new Response(xhr.responseText || null, {
          status: xhr.status,
          statusText: xhr.statusText,
        }),
      );
    xhr.onerror = () => reject(new ApiError(0, 'Could not reach the server.'));
    xhr.onabort = xhr.onerror;
    xhr.send(body ?? null);
  });
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
