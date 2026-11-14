import { apiRequest } from '../../../common/api/http-client.ts';

// The API answers 204 with no body
export function deleteDocument(id: number) {
  return apiRequest<void>(`/api/documents/${id}`, { method: 'DELETE' });
}
