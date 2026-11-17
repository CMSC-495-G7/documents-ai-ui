import { apiRequest } from '../../../common/api/http-client.ts';
import type { AskSettings } from '../types.ts';

export function getAskSettings() {
  return apiRequest<AskSettings>('/api/ask/settings');
}
