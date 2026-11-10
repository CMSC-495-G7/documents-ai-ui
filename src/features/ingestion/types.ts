// Same shape as GET /api/documents.
export type DocumentStatus = 'queued' | 'processing' | 'ready' | 'failed';

export type DocumentItem = {
  id: number;
  title: string;
  file_type: 'pdf' | 'docx';
  // In bytes.
  size: number;
  status: DocumentStatus;
  error_message: string;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
};
