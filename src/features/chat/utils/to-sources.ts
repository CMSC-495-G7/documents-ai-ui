import type { Citation, CitedSource } from '../types.ts';

// "Page 3" for PDFs, the heading for Word files, "" when there's neither
export function citationLocation(citation: Citation) {
  if (citation.page) return `Page ${citation.page}`;
  else return citation.section || '';
}

// The answer cites [1], [2] in the same order as the citations.
export function toSources(citations: Citation[]): CitedSource[] {
  return citations.map((citation, index) => ({
    id: index + 1,
    title: citation.document_title,
    markdown: citation.text,
    // The kit shows this under the title in the sources panel
    fileType: citationLocation(citation) || undefined,
    documentId: citation.document_id,
    page: citation.page,
  }));
}
