import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { makeDocument } from '../../../testing/document-fixtures.ts';
import type { DocumentItem } from '../types.ts';
import { DocumentList } from './document-list.tsx';

function renderList(
  documents: DocumentItem[],
  { onDelete = vi.fn(), deletingId = null as number | null } = {},
) {
  render(
    <DocumentList
      documents={documents}
      onDelete={onDelete}
      deletingId={deletingId}
    />,
  );
  return onDelete;
}

function rows() {
  // The first row is the header.
  return within(screen.getByRole('table', { name: 'Documents' }))
    .getAllByRole('row')
    .slice(1);
}

describe('DocumentList', () => {
  it('shows title, size and status for each document', () => {
    renderList([
      makeDocument({ id: 1, title: 'Handbook', status: 'ready' }),
      makeDocument({
        id: 2,
        title: 'Benefits',
        file_type: 'docx',
        size: 1536,
      }),
    ]);

    const [first, second] = rows();
    expect(first).toHaveTextContent('Handbook');
    expect(first).toHaveTextContent('PDF');
    expect(first).toHaveTextContent('Ready');
    expect(second).toHaveTextContent('Benefits');
    expect(second).toHaveTextContent('DOCX');
    expect(second).toHaveTextContent('Queued');
  });

  it('shows why a document failed', () => {
    renderList([
      makeDocument({
        status: 'failed',
        error_message: 'No text found in this file.',
      }),
    ]);
    expect(rows()[0]).toHaveTextContent('Failed');
    expect(rows()[0]).toHaveTextContent('No text found in this file.');
  });

  it('shows the size in a readable unit', () => {
    renderList([makeDocument({ size: 1536 })]);
    expect(rows()[0]).toHaveTextContent('1.5 KB');
  });

  it('shows a message when there are no documents', () => {
    renderList([]);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByText(/no documents yet/i)).toBeInTheDocument();
  });
});

describe('DocumentList delete', () => {
  const handbook = makeDocument({ id: 1, title: 'Handbook' });
  const benefits = makeDocument({ id: 2, title: 'Benefits' });

  it('asks before deleting', async () => {
    const onDelete = renderList([handbook, benefits]);

    await userEvent.click(
      screen.getByRole('button', { name: 'Delete Handbook' }),
    );
    expect(
      screen.getByRole('dialog', { name: 'Delete Handbook?' }),
    ).toBeInTheDocument();
    expect(onDelete).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Yes' }));
    expect(onDelete).toHaveBeenCalledExactlyOnceWith(handbook);
  });

  it('does nothing when you say no', async () => {
    const onDelete = renderList([handbook]);

    await userEvent.click(
      screen.getByRole('button', { name: 'Delete Handbook' }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'No' }));

    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows which one is deleting and locks the other buttons', () => {
    renderList([handbook, benefits], { deletingId: 1 });

    expect(rows()[0]).toHaveTextContent('Deleting…');
    expect(
      screen.queryByRole('button', { name: 'Delete Handbook' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Delete Benefits' }),
    ).toBeDisabled();
  });
});
