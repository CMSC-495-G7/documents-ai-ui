import type { Message } from '@radixp0int/ai-chat-kit/chat';
import type { AskAnswer } from '../types.ts';
import { toSources } from './to-sources.ts';

// A saved answer as the two chat bubbles: the question, then the answer
// Lib numbers messages from 1 and up, so we use negative IDs
export function savedTurn(answer: AskAnswer): Message[] {
  return [
    {
      id: -2 * answer.id,
      role: 'user',
      content: answer.question,
    },
    {
      id: -2 * answer.id - 1,
      role: 'assistant',
      content: answer.answer,
      sources: toSources(answer.citations),
    },
  ];
}
