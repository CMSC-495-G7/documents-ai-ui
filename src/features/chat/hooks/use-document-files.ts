import { useCallback, useRef } from 'react';
import { getDocumentFile } from '../api/get-document-file.ts';

async function fetchFile(documentId: number) {
  const file = await getDocumentFile(documentId);
  // Only loaded when a PDF opens, so pdf.js stays out of the first page load
  if (file.type === 'application/pdf') {
    await import('../../../common/lib/pdf-worker.ts');
  }
  return file;
}

// Each file is fetched once while the page is open. Switching between
// Excerpt and Original, or the pop-out, reuses it.
export function useDocumentFiles() {
  const files = useRef(new Map<number, Promise<Blob>>());

  return useCallback((documentId: number) => {
    let file = files.current.get(documentId);
    if (!file) {
      file = fetchFile(documentId);
      // Forget a failed one, so Try again fetches it again
      file.catch(() => files.current.delete(documentId));
      files.current.set(documentId, file);
    }
    return file;
  }, []);
}
