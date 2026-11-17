import { vi } from 'vitest';

type Reply = { status: number; body?: unknown };
// A function can return a promise, to keep a request waiting.
// It can also return a Response, for files (see fileResponse).
type Route =
  Reply | ((init: RequestInit) => Reply | Response | Promise<Reply | Response>);

export function jsonResponse({ status, body }: Reply) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// A file the API sends back, like a PDF. Use it in a function route,
// a Response can only be read once.
export function fileResponse(text: string, contentType: string) {
  return new Response(new TextEncoder().encode(text), {
    status: 200,
    headers: { 'Content-Type': contentType },
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
      const reply = typeof route === 'function' ? await route(init) : route;
      return reply instanceof Response ? reply : jsonResponse(reply);
    },
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

export function headersOf(fetchMock: ReturnType<typeof mockApi>, call: number) {
  return fetchMock.mock.calls[call][1]?.headers as Record<string, string>;
}
