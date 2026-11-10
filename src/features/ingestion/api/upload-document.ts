import { apiRequest } from '../../../common/api/http-client.ts';
import type { DocumentItem } from '../types.ts';

export function uploadDocument(
  file: File,
  onProgress: (percent: number) => void,
) {
  const body = new FormData();
  // The API reads the field called "file".
  body.append('file', file);
  return apiRequest<DocumentItem>('/api/documents', {
    method: 'POST',
    body,
    onUploadProgress: onProgress,
  });
}
