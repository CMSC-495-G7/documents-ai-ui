import {
  act,
  cleanup,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { paths } from '../../../common/config/paths.ts';
import { adminUser, signedInAs } from '../../../testing/auth-fixtures.ts';
import { fileOf, makeDocument } from '../../../testing/document-fixtures.ts';
import { jsonResponse, type mockApi } from '../../../testing/mock-api.ts';
import { renderWithRouter } from '../../../testing/render-with-router.tsx';
import { REFRESH_INTERVAL_MS } from '../hooks/use-document-refresh.ts';
import type { DocumentItem } from '../types.ts';
import { ingestionRoutes } from '../ingestion-routes.tsx';

const handbook = makeDocument({ id: 1, title: 'Handbook' });
const benefits = makeDocument({ id: 2, title: 'Benefits' });

function renderPage() {
  return renderWithRouter(
    [{ path: paths.ingestion, children: ingestionRoutes }],
    paths.ingestion,
  );
}

function listLoaded() {
  return waitFor(() =>
    expect(screen.queryByText('Loading documents…')).not.toBeInTheDocument(),
  );
}

function pickFile(file: File) {
  return userEvent.upload(screen.getByLabelText('Choose file'), file);
}

function documentTitles() {
  const table = screen.getByRole('table', { name: 'Documents' });
  return within(table)
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[0].textContent);
}

describe('IngestionPage', () => {
  it('renders at the ingestion base path', () => {
    signedInAs(adminUser, {
      'GET /api/documents': { status: 200, body: [] },
    });
    renderPage();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Ingestion' }),
    ).toBeInTheDocument();
  });

  it('lists the workspace documents', async () => {
    signedInAs(adminUser, {
      'GET /api/documents': { status: 200, body: [benefits, handbook] },
    });
    renderPage();
    expect(screen.getByText('Loading documents…')).toBeInTheDocument();
    expect(
      await screen.findByRole('table', { name: 'Documents' }),
    ).toBeInTheDocument();
    expect(documentTitles()).toEqual(['Benefits', 'Handbook']);
  });

  it('lets you retry when the list fails to load', async () => {
    let fail = true;
    signedInAs(adminUser, {
      'GET /api/documents': () =>
        fail ? { status: 500 } : { status: 200, body: [handbook] },
    });
    renderPage();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent("Couldn't load the documents.");
    fail = false;
    await userEvent.click(
      within(alert).getByRole('button', { name: 'Try again' }),
    );
    expect(
      await screen.findByRole('table', { name: 'Documents' }),
    ).toBeInTheDocument();
  });

  it('uploads a file and adds it to the top of the list', async () => {
    const uploaded = makeDocument({ id: 3, title: 'Security policy' });
    const fetchMock = signedInAs(adminUser, {
      'GET /api/documents': { status: 200, body: [handbook] },
      'POST /api/documents': { status: 201, body: uploaded },
    });
    renderPage();
    await screen.findByRole('table', { name: 'Documents' });

    await pickFile(fileOf('Security policy.pdf'));

    expect(await screen.findByRole('status')).toHaveTextContent(
      "Security policy.pdf uploaded. It's queued for processing.",
    );
    expect(documentTitles()).toEqual(['Security policy', 'Handbook']);

    const post = fetchMock.mock.calls.find(
      ([, options]) => options?.method === 'POST',
    );
    const body = post?.[1]?.body as FormData;
    expect(body.get('file')).toBeInstanceOf(File);
  });

  it('shows a progress bar and locks the drop zone while uploading', async () => {
    signedInAs(adminUser, { 'GET /api/documents': { status: 200, body: [] } });
    renderPage();
    await listLoaded();

    let finish = () => {};
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            finish = () =>
              resolve(jsonResponse({ status: 201, body: handbook }));
          }),
      ),
    );
    await pickFile(fileOf('Handbook.pdf'));

    const bar = screen.getByRole('progressbar', {
      name: 'Uploading Handbook.pdf… 50%',
    });
    expect(bar).toHaveAttribute('value', '50');
    expect(screen.getByLabelText('Choose file')).toBeDisabled();

    finish();
    expect(await screen.findByRole('status')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Choose file')).toBeEnabled();
  });

  it('shows the API message when the server rejects the file', async () => {
    signedInAs(adminUser, {
      'GET /api/documents': { status: 200, body: [] },
      'POST /api/documents': {
        status: 415,
        body: { detail: 'Only PDF and DOCX files can be uploaded.' },
      },
    });
    renderPage();

    await pickFile(fileOf('renamed.pdf'));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Only PDF and DOCX files can be uploaded.',
    );
  });

  it('shows a plain message when the server fails', async () => {
    signedInAs(adminUser, {
      'GET /api/documents': { status: 200, body: [] },
      'POST /api/documents': { status: 500 },
    });
    renderPage();

    await pickFile(fileOf('Handbook.pdf'));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      "The upload didn't finish.",
    );
  });

  it('checks the file before sending it', async () => {
    const fetchMock = signedInAs(adminUser, {
      'GET /api/documents': { status: 200, body: [] },
    });
    renderPage();
    await listLoaded();

    fireEvent.drop(screen.getByRole('region', { name: 'Upload a document' }), {
      dataTransfer: { files: [fileOf('notes.txt')] },
    });
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Only PDF and DOCX files can be uploaded.',
    );
    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some(([, init]) => init?.method === 'POST'),
      ).toBe(false),
    );
  });
});

describe('IngestionPage delete', () => {
  async function deleteHandbook() {
    await screen.findByRole('table', { name: 'Documents' });
    await userEvent.click(
      screen.getByRole('button', { name: 'Delete Handbook' }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Yes' }));
  }

  it('deletes a document and takes it off the list', async () => {
    const fetchMock = signedInAs(adminUser, {
      'GET /api/documents': { status: 200, body: [benefits, handbook] },
      'DELETE /api/documents/1': { status: 204 },
    });
    renderPage();

    await deleteHandbook();

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Handbook deleted.',
    );
    expect(documentTitles()).toEqual(['Benefits']);
    expect(
      fetchMock.mock.calls.some(([, init]) => init?.method === 'DELETE'),
    ).toBe(true);
  });

  it('takes it off the list if it was already deleted', async () => {
    signedInAs(adminUser, {
      'GET /api/documents': { status: 200, body: [benefits, handbook] },
      'DELETE /api/documents/1': {
        status: 404,
        body: { detail: 'Document not found.' },
      },
    });
    renderPage();

    await deleteHandbook();

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Handbook deleted.',
    );
    expect(documentTitles()).toEqual(['Benefits']);
  });

  it('keeps the document and says so when the delete fails', async () => {
    signedInAs(adminUser, {
      'GET /api/documents': { status: 200, body: [benefits, handbook] },
      'DELETE /api/documents/1': { status: 500 },
    });
    renderPage();

    await deleteHandbook();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Couldn't delete Handbook. Try again.",
    );
    expect(documentTitles()).toEqual(['Benefits', 'Handbook']);
    expect(
      screen.getByRole('button', { name: 'Delete Handbook' }),
    ).toBeEnabled();
  });
});

describe('IngestionPage status refresh', () => {
  beforeEach(() => {
    // Fake clock we can jump forward. It still ticks, so findBy works.
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Each GET gets the next answer. The last one repeats.
  function listAnswers(...answers: (DocumentItem[] | 'error')[]) {
    let call = 0;
    return () => {
      const answer = answers[Math.min(call, answers.length - 1)];
      call += 1;
      return answer === 'error'
        ? { status: 500 }
        : { status: 200, body: answer };
    };
  }

  function listCalls(fetchMock: ReturnType<typeof mockApi>) {
    return fetchMock.mock.calls.filter(
      ([url, init]) =>
        url === '/api/documents' && (init?.method ?? 'GET') === 'GET',
    ).length;
  }

  function waitOneRefresh() {
    return act(() => vi.advanceTimersByTimeAsync(REFRESH_INTERVAL_MS));
  }

  function statusOf(title: string) {
    const table = screen.getByRole('table', { name: 'Documents' });
    const row = within(table).getByRole('row', { name: new RegExp(title) });
    return within(row).getAllByRole('cell')[3].textContent;
  }

  it('updates statuses until every document is done', async () => {
    const fetchMock = signedInAs(adminUser, {
      'GET /api/documents': listAnswers(
        [makeDocument({ title: 'Handbook', status: 'queued' })],
        [makeDocument({ title: 'Handbook', status: 'processing' })],
        [makeDocument({ title: 'Handbook', status: 'ready' })],
      ),
    });
    renderPage();
    await screen.findByRole('table', { name: 'Documents' });
    expect(statusOf('Handbook')).toBe('Queued');

    await waitOneRefresh();
    expect(statusOf('Handbook')).toBe('Processing');

    await waitOneRefresh();
    expect(statusOf('Handbook')).toBe('Ready');
    expect(listCalls(fetchMock)).toBe(3);

    // Nothing left to wait for, so no more requests.
    await waitOneRefresh();
    await waitOneRefresh();
    expect(listCalls(fetchMock)).toBe(3);
  });

  it('does not refresh when everything is already done', async () => {
    const fetchMock = signedInAs(adminUser, {
      'GET /api/documents': {
        status: 200,
        body: [makeDocument({ status: 'ready' })],
      },
    });
    renderPage();
    await screen.findByRole('table', { name: 'Documents' });

    await waitOneRefresh();
    await waitOneRefresh();
    expect(listCalls(fetchMock)).toBe(1);
    expect(
      screen.queryByText(/statuses update on their own/i),
    ).not.toBeInTheDocument();
  });

  it('says statuses update on their own while something is processing', async () => {
    signedInAs(adminUser, {
      'GET /api/documents': {
        status: 200,
        body: [makeDocument({ status: 'processing' })],
      },
    });
    renderPage();
    expect(
      await screen.findByText(/statuses update on their own/i),
    ).toBeInTheDocument();
  });

  it('starts refreshing after an upload', async () => {
    const uploaded = makeDocument({ id: 3, title: 'Security policy' });
    const fetchMock = signedInAs(adminUser, {
      'GET /api/documents': listAnswers([], [{ ...uploaded, status: 'ready' }]),
      'POST /api/documents': { status: 201, body: uploaded },
    });
    renderPage();
    await listLoaded();

    await pickFile(fileOf('Security policy.pdf'));
    await screen.findByRole('table', { name: 'Documents' });
    expect(statusOf('Security policy')).toBe('Queued');

    await waitOneRefresh();
    expect(statusOf('Security policy')).toBe('Ready');
    expect(listCalls(fetchMock)).toBe(2);
  });

  it('stops asking after you leave the page', async () => {
    const fetchMock = signedInAs(adminUser, {
      'GET /api/documents': {
        status: 200,
        body: [makeDocument({ status: 'queued' })],
      },
    });
    renderPage();
    await screen.findByRole('table', { name: 'Documents' });

    cleanup();
    await waitOneRefresh();
    await waitOneRefresh();
    expect(listCalls(fetchMock)).toBe(1);
  });

  it('keeps the list and tries again when a refresh fails', async () => {
    signedInAs(adminUser, {
      'GET /api/documents': listAnswers(
        [makeDocument({ title: 'Handbook', status: 'processing' })],
        'error',
        [makeDocument({ title: 'Handbook', status: 'ready' })],
      ),
    });
    renderPage();
    await screen.findByRole('table', { name: 'Documents' });

    await waitOneRefresh();
    expect(statusOf('Handbook')).toBe('Processing');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    await waitOneRefresh();
    expect(statusOf('Handbook')).toBe('Ready');
  });
});
