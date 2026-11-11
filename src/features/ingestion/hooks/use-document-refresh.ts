import { useEffect, useState } from 'react';
import { listDocuments } from '../api/list-documents.ts';
import type { DocumentItem } from '../types.ts';
import { hasPendingDocuments } from '../utils/has-pending-documents.ts';

export const REFRESH_INTERVAL_MS = 3000;

// Gets the list again every few seconds while something is still processing.
export function useDocumentRefresh(
  documents: DocumentItem[] | null,
  setDocuments: (documents: DocumentItem[]) => void,
) {
  // Bumped after a failed refresh, so the effect runs again.
  const [failedAttempts, setFailedAttempts] = useState(0);

  useEffect(() => {
    if (documents === null || !hasPendingDocuments(documents)) {
      return;
    }

    // Set when the list changes (upload) or the page closes.
    // Then this answer is old and gets ignored.
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const latest = await listDocuments();
        if (!cancelled) setDocuments(latest);
      } catch {
        // Keep showing the old list and try again.
        if (!cancelled) setFailedAttempts((count) => count + 1);
      }
    }, REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [documents, failedAttempts, setDocuments]);
}
