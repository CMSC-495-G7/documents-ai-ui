import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { paths } from '../../../common/config/paths.ts';
import { adminUser, signedInAs } from '../../../testing/auth-fixtures.ts';
import { fileOf, makeDocument } from '../../../testing/document-fixtures.ts';
import { jsonResponse } from '../../../testing/mock-api.ts';
import { renderWithRouter } from '../../../testing/render-with-router.tsx';
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
