import type { AskAnswer, Citation } from '../features/chat/types.ts';

export function makeCitation(fields: Partial<Citation> = {}): Citation {
  return {
    chunk_id: 11,
    document_id: 1,
    document_title: 'Employee Handbook',
    page: 3,
    section: '',
    text: 'Employees get 20 days of paid leave per year.',
    score: 0.82,
    ...fields,
  };
}

// Cites a PDF page and a Word section, best match first.
export const askAnswer: AskAnswer = {
  id: 7,
  answer: 'You get 20 days of paid leave [1]. Unused days carry over [2].',
  model: 'gpt-5-mini',
  citations: [
    makeCitation(),
    makeCitation({
      chunk_id: 12,
      document_id: 2,
      document_title: 'Leave Policy',
      page: null,
      section: 'Carry over',
      text: 'Up to 5 unused days carry over to next year.',
      score: 0.71,
    }),
  ],
};

export const notFoundAnswer: AskAnswer = {
  id: 8,
  answer: "I couldn't find this in the documents",
  model: '',
  citations: [],
};
