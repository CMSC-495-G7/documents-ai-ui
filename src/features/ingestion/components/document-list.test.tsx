import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { makeDocument } from '../../../testing/document-fixtures.ts';
import { DocumentList } from './document-list.tsx';

function rows() {
  // The first row is the header.
  return within(screen.getByRole('table', { name: 'Documents' }))
    .getAllByRole('row')
    .slice(1);
}

describe('DocumentList', () => {
  it('shows title, size and status for each document', () => {
    render(
      <DocumentList
        documents={[
          makeDocument({ id: 1, title: 'Handbook', status: 'ready' }),
          makeDocument({
            id: 2,
            title: 'Benefits',
            file_type: 'docx',
            size: 1536,
          }),
        ]}
      />,
    );

    const [first, second] = rows();
    expect(first).toHaveTextContent('Handbook');
    expect(first).toHaveTextContent('PDF');
    expect(first).toHaveTextContent('Ready');
    expect(second).toHaveTextContent('Benefits');
    expect(second).toHaveTextContent('DOCX');
    expect(second).toHaveTextContent('Queued');
  });

  it('shows why a document failed', () => {
    render(
      <DocumentList
        documents={[
          makeDocument({
            status: 'failed',
            error_message: 'No text found in this file.',
          }),
        ]}
      />,
    );
    expect(rows()[0]).toHaveTextContent('Failed');
    expect(rows()[0]).toHaveTextContent('No text found in this file.');
  });

  it('shows the size in a readable unit', () => {
    render(<DocumentList documents={[makeDocument({ size: 1536 })]} />);
    expect(rows()[0]).toHaveTextContent('1.5 KB');
  });

  it('shows a message when there are no documents', () => {
    render(<DocumentList documents={[]} />);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByText(/no documents yet/i)).toBeInTheDocument();
  });
});
