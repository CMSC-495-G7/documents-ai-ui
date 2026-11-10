import { describe, expect, it, vi } from 'vitest';
import { headersOf, mockApi } from '../../testing/mock-api.ts';
import { apiRequest, onSessionExpired } from './http-client.ts';
import { tokenStorage } from './token-storage.ts';

const unauthorized = { status: 401, body: { detail: 'Unauthorized' } };

describe('apiRequest', () => {
  it('sends the access token', async () => {
    tokenStorage.set({ access: 'a1', refresh: 'r1' });
    const fetchMock = mockApi({
      'GET /api/things': { status: 200, body: [1] },
    });

    await expect(apiRequest('/api/things')).resolves.toEqual([1]);
    expect(headersOf(fetchMock, 0).Authorization).toBe('Bearer a1');
  });

  it('leaves the token off public requests', async () => {
    tokenStorage.set({ access: 'a1', refresh: 'r1' });
    const fetchMock = mockApi({
      'POST /api/public': { status: 200, body: {} },
    });

    await apiRequest('/api/public', { method: 'POST', body: {}, auth: false });
    expect(headersOf(fetchMock, 0).Authorization).toBeUndefined();
  });

  it('refreshes once on 401 and retries with the new token', async () => {
    tokenStorage.set({ access: 'old', refresh: 'r1' });
    const fetchMock = mockApi({
      'GET /api/things': (init) =>
        (init.headers as Record<string, string>).Authorization === 'Bearer new'
          ? { status: 200, body: 'ok' }
          : unauthorized,
      'POST /api/auth/refresh': { status: 200, body: { access: 'new' } },
    });

    await expect(apiRequest('/api/things')).resolves.toBe('ok');
    expect(tokenStorage.getAccess()).toBe('new');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('shares one refresh between requests that fail together', async () => {
    tokenStorage.set({ access: 'old', refresh: 'r1' });
    const fetchMock = mockApi({
      'GET /api/things': (init) =>
        (init.headers as Record<string, string>).Authorization === 'Bearer new'
          ? { status: 200, body: 'ok' }
          : unauthorized,
      'POST /api/auth/refresh': { status: 200, body: { access: 'new' } },
    });

    await Promise.all([apiRequest('/api/things'), apiRequest('/api/things')]);
    const refreshCalls = fetchMock.mock.calls.filter(
      ([url]) => url === '/api/auth/refresh',
    );
    expect(refreshCalls).toHaveLength(1);
  });

  it('ends the session when the refresh token is rejected', async () => {
    tokenStorage.set({ access: 'old', refresh: 'r1' });
    mockApi({
      'GET /api/things': unauthorized,
      'POST /api/auth/refresh': unauthorized,
    });
    const expired = vi.fn();
    const stopListening = onSessionExpired(expired);

    await expect(apiRequest('/api/things')).rejects.toMatchObject({
      status: 401,
    });
    expect(expired).toHaveBeenCalledOnce();
    expect(tokenStorage.getRefresh()).toBeNull();
    stopListening();
  });

  it('uses the API detail as the error message', async () => {
    mockApi({
      'GET /api/admin': { status: 403, body: { detail: 'Admins only.' } },
    });
    await expect(apiRequest('/api/admin')).rejects.toMatchObject({
      status: 403,
      message: 'Admins only.',
    });
  });

  it('uses status 0 when the server cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
    await expect(apiRequest('/api/things')).rejects.toMatchObject({
      status: 0,
    });
  });
});

describe('apiRequest with upload progress', () => {
  function upload(onUploadProgress: (percent: number) => void) {
    return apiRequest('/api/files', {
      method: 'POST',
      body: new FormData(),
      onUploadProgress,
    });
  }

  it('reports progress and returns the reply', async () => {
    tokenStorage.set({ access: 'a1', refresh: 'r1' });
    const fetchMock = mockApi({
      'POST /api/files': { status: 201, body: { id: 7 } },
    });
    const progress: number[] = [];

    await expect(upload((percent) => progress.push(percent))).resolves.toEqual({
      id: 7,
    });
    expect(progress).toEqual([50, 100]);
    expect(headersOf(fetchMock, 0).Authorization).toBe('Bearer a1');
    expect(headersOf(fetchMock, 0)['Content-Type']).toBeUndefined();
  });

  it('uses the API detail as the error message', async () => {
    mockApi({
      'POST /api/files': { status: 413, body: { detail: 'Too big.' } },
    });
    await expect(upload(() => {})).rejects.toMatchObject({
      status: 413,
      message: 'Too big.',
    });
  });

  it('refreshes once on 401 and sends the upload again', async () => {
    tokenStorage.set({ access: 'old', refresh: 'r1' });
    const fetchMock = mockApi({
      'POST /api/files': (init) =>
        (init.headers as Record<string, string>).Authorization === 'Bearer new'
          ? { status: 201, body: 'ok' }
          : unauthorized,
      'POST /api/auth/refresh': { status: 200, body: { access: 'new' } },
    });

    await expect(upload(() => {})).resolves.toBe('ok');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('uses status 0 when the server cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
    await expect(upload(() => {})).rejects.toMatchObject({ status: 0 });
  });
});
