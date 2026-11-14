import { Button } from '@radixp0int/ai-chat-kit';
import { useConfirm } from '../../../common/hooks/use-confirm.tsx';
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
  onDelete: (document: DocumentItem) => void | Promise<void>;
  onDeleteError: (document: DocumentItem) => void;
  // The one being deleted right now, if any
  deletingId: number | null;
};

export function DocumentList({
  documents,
  onDelete,
  onDeleteError,
  deletingId,
}: DocumentListProps) {
  const { confirm, confirmDialog } = useConfirm();

  async function askToDelete(document: DocumentItem) {
    const yes = await confirm({
      title: `Delete ${document.title}?`,
      message:
        "The file and its search data are removed. This can't be undone.",
      danger: true,
    });
    if (yes) await onDelete(document);
  }

  if (documents.length === 0) {
    return <p className="document-list-empty">No documents yet</p>;
  }

  return (
    <>
      {confirmDialog}
      <table className="document-list" aria-label="Documents">
        <thead>
          <tr>
            <th scope="col">Title</th>
            <th scope="col">Type</th>
            <th scope="col">Size</th>
            <th scope="col">Status</th>
            <th scope="col">Uploaded</th>
            <th scope="col">Actions</th>
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
              <td className="document-list-actions">
                {deletingId === document.id ? (
                  <span>Deleting…</span>
                ) : (
                  <Button
                    size="sm"
                    variant="danger"
                    aria-label={`Delete ${document.title}`}
                    disabled={deletingId !== null}
                    onClick={() => {
                      void askToDelete(document).catch(() =>
                        onDeleteError(document),
                      );
                    }}
                  >
                    Delete
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
