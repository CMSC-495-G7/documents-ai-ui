import { apiRequest } from '../../../common/api/http-client.ts';
import type { AskSettings } from '../types.ts';

// Admins only. A provider with no API key gets a 422
export function updateAskSettings(answerProvider: string) {
  return apiRequest<AskSettings>('/api/ask/settings', {
    method: 'PATCH',
    body: { answer_provider: answerProvider },
  });
}
