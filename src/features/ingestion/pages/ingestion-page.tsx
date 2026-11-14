import { useEffect, useState } from 'react';
import { ApiError } from '../../../common/api/http-client.ts';
import { deleteDocument } from '../api/delete-document.ts';
import { listDocuments } from '../api/list-documents.ts';
import { uploadDocument } from '../api/upload-document.ts';
import { DocumentList } from '../components/document-list.tsx';
import { UploadDropzone } from '../components/upload-dropzone.tsx';
import { useDocumentRefresh } from '../hooks/use-document-refresh.ts';
import type { DocumentItem } from '../types.ts';
import { checkFile } from '../utils/check-file.ts';
import { hasPendingDocuments } from '../utils/has-pending-documents.ts';
import './ingestion-page.css';

const UPLOAD_FAILED =
  "The upload didn't finish. Check your connection and try again.";

type Upload =
  | { state: 'idle' }
  | { state: 'uploading'; name: string; percent: number }
  | { state: 'done'; name: string }
  | { state: 'error'; message: string };

type Removal =
  | { state: 'idle' }
  | { state: 'deleting'; id: number }
  | { state: 'done'; title: string }
  | { state: 'error'; title: string };

export function IngestionPage() {
  // null = still loading
  const [documents, setDocuments] = useState<DocumentItem[] | null>(null);
  const [listFailed, setListFailed] = useState(false);
  const [upload, setUpload] = useState<Upload>({ state: 'idle' });
  const [removal, setRemoval] = useState<Removal>({ state: 'idle' });

  useEffect(() => {
    let cancelled = false;
    listDocuments()
      .then((list) => {
        if (!cancelled) setDocuments(list);
      })
      .catch(() => {
        if (!cancelled) setListFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useDocumentRefresh(documents, setDocuments);

  function retryList() {
    setListFailed(false);
    listDocuments().then(setDocuments, () => setListFailed(true));
  }

  async function handleFile(file: File) {
    const problem = checkFile(file);
    if (problem) {
      setUpload({ state: 'error', message: problem });
      return;
    }

    const name = file.name;
    setUpload({ state: 'uploading', name, percent: 0 });
    try {
      const document = await uploadDocument(file, (percent) =>
        setUpload({ state: 'uploading', name, percent }),
      );
      // New uploads go on top, same as the API's order.
      setDocuments((current) => [document, ...(current ?? [])]);
      setUpload({ state: 'done', name });
    } catch (error) {
      setUpload({ state: 'error', message: uploadErrorMessage(error) });
    }
  }

  async function handleDelete(document: DocumentItem) {
    setRemoval({ state: 'deleting', id: document.id });
    try {
      await deleteDocument(document.id);
    } catch (error) {
      // 404 = someone else already deleted it, so it's gone either way
      if (!(error instanceof ApiError && error.status === 404)) {
        handleDeleteError(document);
        return;
      }
    }
    setDocuments((current) =>
      (current ?? []).filter((item) => item.id !== document.id),
    );
    setRemoval({ state: 'done', title: document.title });
  }

  function handleDeleteError(document: DocumentItem) {
    setRemoval({ state: 'error', title: document.title });
  }

  return (
    <section className="ingestion-page">
      <h1>Ingestion</h1>
      <p>Add documents for the assistant to search.</p>

      <UploadDropzone
        disabled={upload.state === 'uploading'}
        onFile={handleFile}
      />

      {upload.state === 'uploading' && (
        <div className="upload-progress">
          <label htmlFor="upload-progress">
            Uploading {upload.name}… {upload.percent}%
          </label>
          <progress id="upload-progress" max={100} value={upload.percent} />
        </div>
      )}
      {upload.state === 'done' && (
        <p role="status" className="upload-message" data-tone="success">
          {upload.name} uploaded. It's queued for processing.
        </p>
      )}
      {upload.state === 'error' && (
        <p role="alert" className="upload-message" data-tone="error">
          {upload.message}
        </p>
      )}

      <h2>Documents</h2>
      {removal.state === 'done' && (
        <p role="status" className="upload-message" data-tone="success">
          {removal.title} deleted.
        </p>
      )}
      {removal.state === 'error' && (
        <p role="alert" className="upload-message" data-tone="error">
          Couldn't delete {removal.title}. Try again.
        </p>
      )}
      {listFailed ? (
        <div role="alert" className="upload-message" data-tone="error">
          Couldn't load the documents.{' '}
          <button type="button" onClick={retryList}>
            Try again
          </button>
        </div>
      ) : documents === null ? (
        <p>Loading documents…</p>
      ) : (
        <>
          {hasPendingDocuments(documents) && (
            <p className="document-refresh-note">
              Statuses update on their own while files are processed.
            </p>
          )}
          <DocumentList
            documents={documents}
            onDelete={handleDelete}
            onDeleteError={handleDeleteError}
            deletingId={removal.state === 'deleting' ? removal.id : null}
          />
        </>
      )}
    </section>
  );
}

function uploadErrorMessage(error: unknown) {
  // The API's 4xx messages are written for people (too big, wrong type, ...).
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
    return error.message;
  }
  return UPLOAD_FAILED;
}
