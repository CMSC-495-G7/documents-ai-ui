import type { DocumentItem } from '../features/ingestion/types.ts';

export function makeDocument(fields: Partial<DocumentItem> = {}): DocumentItem {
  return {
    id: 1,
    title: 'Employee Handbook',
    file_type: 'pdf',
    size: 2.5 * 1024 * 1024,
    status: 'queued',
    error_message: '',
    uploaded_by: 'admin@acme.example',
    created_at: '2026-11-06T14:00:00Z',
    updated_at: '2026-11-06T14:00:00Z',
    ...fields,
  };
}

// A File with a fake size, so tests don't build 16 MB of bytes.
export function fileOf(name: string, size = 1024) {
  const file = new File(['x'], name);
  Object.defineProperty(file, 'size', { value: size });
  return file;
}
