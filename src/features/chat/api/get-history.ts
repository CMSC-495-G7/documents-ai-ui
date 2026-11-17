import { apiRequest } from '../../../common/api/http-client.ts';
import type { HistoryItem } from '../types.ts';

// Your last 20 questions, newest first
export function getHistory() {
  return apiRequest<HistoryItem[]>('/api/ask/history');
}
