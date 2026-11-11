import type { DocumentItem } from '../types.ts';

// True while any document is still waiting or being processed.
export function hasPendingDocuments(documents: DocumentItem[]): boolean {
  return documents.some(
    (document) =>
      document.status === 'queued' || document.status === 'processing',
  );
}
