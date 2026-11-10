import { apiRequest } from '../../../common/api/http-client.ts';
import type { DocumentItem } from '../types.ts';

export function listDocuments() {
  return apiRequest<DocumentItem[]>('/api/documents');
}
