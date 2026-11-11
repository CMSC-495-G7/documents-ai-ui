import { useEffect } from 'react';
import { listDocuments } from '../api/list-documents.ts';
import type { DocumentItem } from '../types.ts';
import { hasPendingDocuments } from '../utils/has-pending-documents.ts';

export const REFRESH_INTERVAL_MS = 3000;

// Gets the list again every few seconds while something is still processing
export function useDocumentRefresh(
  documents: DocumentItem[] | null,
  setDocuments: (documents: DocumentItem[]) => void,
) {
  useEffect(() => {
    if (documents === null || !hasPendingDocuments(documents)) {
      return;
    }

    // Set when the list changes (new list, upload) or the page closes.
    // An answer that arrives after that is old and gets ignored.
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function refresh() {
      try {
        const latest = await listDocuments();
        // A new list runs this effect again, which plans the next refresh.
        if (!cancelled) setDocuments(latest);
      } catch {
        // Keep showing the old list and try again later.
        if (!cancelled) timer = setTimeout(refresh, REFRESH_INTERVAL_MS);
      }
    }

    timer = setTimeout(refresh, REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [documents, setDocuments]);
}
