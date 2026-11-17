import { apiRequest } from '../../../common/api/http-client.ts';
import type { AskAnswer } from '../types.ts';

// 502 when the AI service fails, 422 for a blank question
export function askQuestion(question: string) {
  return apiRequest<AskAnswer>('/api/ask', {
    method: 'POST',
    body: { question },
  });
}
