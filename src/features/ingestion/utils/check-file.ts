// Same limit and messages as the API (DOCUMENT_MAX_UPLOAD_MB).
export const MAX_UPLOAD_MB = 16;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;
export const ALLOWED_EXTENSIONS = ['.pdf', '.docx'];

export const TYPE_ERROR = 'Only PDF and DOCX files can be uploaded.';
export const SIZE_ERROR = `The file is too big. The limit is ${MAX_UPLOAD_MB} MB.`;

// Quick check before uploading. The API checks again by content.
// Returns the error to show, or null if the file is ok.
export function checkFile(file: File): string | null {
  const name = file.name.toLowerCase();

  if (!ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext))) {
    return TYPE_ERROR;
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return SIZE_ERROR;
  }

  return null;
}
