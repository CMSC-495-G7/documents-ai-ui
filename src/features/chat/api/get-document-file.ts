import { apiBlob } from '../../../common/api/http-client.ts';

// The uploaded PDF or DOCX. 404 if it was deleted
export function getDocumentFile(documentId: number) {
  return apiBlob(`/api/documents/${documentId}/file`);
}
