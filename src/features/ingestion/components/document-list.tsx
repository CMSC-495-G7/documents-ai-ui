import type { DocumentItem, DocumentStatus } from '../types.ts';
import { formatFileSize } from '../utils/format-file-size.ts';
import './document-list.css';

const STATUS_LABELS: Record<DocumentStatus, string> = {
  queued: 'Queued',
  processing: 'Processing',
  ready: 'Ready',
  failed: 'Failed',
};

const dateFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

type DocumentListProps = {
  documents: DocumentItem[];
};

export function DocumentList({ documents }: DocumentListProps) {
  if (documents.length === 0) {
    return <p className="document-list-empty">No documents yet</p>;
  }

  return (
    <table className="document-list" aria-label="Documents">
      <thead>
        <tr>
          <th scope="col">Title</th>
          <th scope="col">Type</th>
          <th scope="col">Size</th>
          <th scope="col">Status</th>
          <th scope="col">Uploaded</th>
        </tr>
      </thead>
      <tbody>
        {documents.map((document) => (
          <tr key={document.id}>
            <td>{document.title}</td>
            <td>{document.file_type.toUpperCase()}</td>
            <td>{formatFileSize(document.size)}</td>
            <td>
              <span className="status-badge" data-status={document.status}>
                {STATUS_LABELS[document.status]}
              </span>
              {document.status === 'failed' && document.error_message && (
                <span className="document-list-error">
                  {document.error_message}
                </span>
              )}
            </td>
            <td>{dateFormat.format(new Date(document.created_at))}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
