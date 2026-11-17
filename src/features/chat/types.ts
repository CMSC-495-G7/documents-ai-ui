import type { Source } from '@radixp0int/ai-chat-kit/chat';

// An excerpt the API used to answer the question.
export type Citation = {
  // These IDs can be null if the excerpt or document is gone. The text is saved separately.
  chunk_id: number | null;
  document_id: number | null;
  document_title: string;
  page: number | null;
  // The heading in a Word document. Empty for PDFs.
  section: string;
  text: string;
  score: number;
};

export type AskAnswer = {
  id: number;
  answer: string;
  // Empty when the app couldn't find a matching excerpt.
  model: string;
  citations: Citation[];
};

// Keep the document ID and page so the app can open the original file in the future.
export type CitedSource = Source & {
  documentId: number | null;
  page: number | null;
};
