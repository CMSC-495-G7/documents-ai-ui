import type {
  AskAnswer,
  Citation,
  HistoryItem,
} from '../features/chat/types.ts';

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
  question: 'How much leave do I get?',
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
  question: 'What is the wifi password?',
  answer: "I couldn't find this in the documents",
  model: '',
  citations: [],
};

// A saved answer from GET /api/ask/5
export const savedAnswer: AskAnswer = {
  id: 5,
  question: 'Can I work from home?',
  answer: 'Yes, up to two days a week [1].',
  model: 'gpt-5-mini',
  citations: [
    makeCitation({
      chunk_id: 21,
      document_id: 3,
      document_title: 'Remote Work Policy',
      page: 2,
      text: 'Employees may work remotely up to two days a week.',
    }),
  ],
};

// GET /api/ask/history, newest first
export const history: HistoryItem[] = [
  {
    id: 5,
    question: 'Can I work from home?',
    created_at: '2026-11-16T15:00:00Z',
  },
  {
    id: 4,
    question: 'When is payday?',
    created_at: '2026-11-02T09:30:00Z',
  },
];
