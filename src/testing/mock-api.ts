import { vi } from 'vitest';

type Reply = { status: number; body?: unknown };
type Route = Reply | ((init: RequestInit) => Reply);

export function jsonResponse({ status, body }: Reply) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Fake fetch. Keys look like "POST /api/auth/login".
export function mockApi(routes: Record<string, Route>) {
  const fetchMock = vi.fn(
    async (input: RequestInfo | URL, init: RequestInit = {}) => {
      const key = `${init.method ?? 'GET'} ${String(input)}`;
      const route = routes[key];
      if (!route) {
        throw new Error(`No mock for ${key}`);
      }
      return jsonResponse(typeof route === 'function' ? route(init) : route);
    },
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

export function headersOf(fetchMock: ReturnType<typeof mockApi>, call: number) {
  return fetchMock.mock.calls[call][1]?.headers as Record<string, string>;
}
