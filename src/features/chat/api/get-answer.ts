import { apiRequest } from '../../../common/api/http-client.ts';
import type { AskAnswer } from '../types.ts';

// A saved answer, same shape as POST /api/ask. 404 if it isn't yours
export function getAnswer(answerId: number) {
  return apiRequest<AskAnswer>(`/api/ask/${answerId}`);
}
