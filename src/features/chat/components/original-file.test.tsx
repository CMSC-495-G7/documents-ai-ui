import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../../common/api/http-client.ts';
import { OriginalFile } from './original-file.tsx';

// jsdom can't draw a PDF
vi.mock('@radixp0int/ai-chat-kit', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@radixp0int/ai-chat-kit')>()),
  DocumentPreview: (await import('../../../testing/fake-document-preview.tsx'))
    .FakeDocumentPreview,
}));

const pdf = new Blob(['%PDF-1.7'], { type: 'application/pdf' });
const docx = new Blob(['PK'], {
  type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
});

function renderFile(loadFile: (documentId: number) => Promise<Blob>) {
  const onLoad = vi.fn();
  render(
    <OriginalFile
      title="Employee Handbook"
      documentId={1}
      page={3}
      loadFile={loadFile}
      zoom={1}
      onLoad={onLoad}
      onPageChange={() => {}}
      onError={() => {}}
    />,
  );
  return onLoad;
}

describe('OriginalFile', () => {
  it('fetches the file and shows it', async () => {
    const loadFile = vi.fn().mockResolvedValue(pdf);
    const onLoad = renderFile(loadFile);

    expect(screen.getByRole('status')).toHaveTextContent(
      'Opening the document…',
    );
    expect(
      await screen.findByRole('group', {
        name: 'Original document: Employee Handbook',
      }),
    ).toHaveTextContent('pdf preview of application/pdf');
    expect(loadFile).toHaveBeenCalledWith(1);
    // The panel uses this for "Page 1 of 4"
    expect(onLoad).toHaveBeenCalledWith({ pageCount: 4 });
  });

  it('shows a Word file too', async () => {
    renderFile(vi.fn().mockResolvedValue(docx));

    expect(await screen.findByRole('group')).toHaveTextContent('docx preview');
  });

  it('explains when the document is gone', async () => {
    renderFile(
      vi.fn().mockRejectedValue(new ApiError(404, 'Document not found.')),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "This document isn't available anymore. The excerpt is all that's left.",
    );
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
  });

  it("says so when the server can't be reached, and tries again", async () => {
    const loadFile = vi
      .fn()
      .mockRejectedValueOnce(new ApiError(0, 'Could not reach the server.'))
      .mockResolvedValueOnce(pdf);
    renderFile(loadFile);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not reach the server.',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('group')).toHaveTextContent('pdf preview');
    expect(loadFile).toHaveBeenCalledTimes(2);
  });

  it('says the same when the dev proxy sends a bare 502', async () => {
    renderFile(vi.fn().mockRejectedValue(new ApiError(502, 'Bad Gateway')));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not reach the server.',
    );
  });

  it('hides anything else behind a general message', async () => {
    renderFile(vi.fn().mockRejectedValue(new ApiError(500, 'Boom')));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Couldn't open the document. Try again.",
    );
  });

  it("says when the file type can't be shown", async () => {
    renderFile(
      vi.fn().mockResolvedValue(new Blob(['hi'], { type: 'text/plain' })),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "This file type can't be shown here.",
    );
  });
});
