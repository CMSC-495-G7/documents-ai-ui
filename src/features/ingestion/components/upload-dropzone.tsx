import { useState, type DragEvent } from 'react';
import { MAX_UPLOAD_MB } from '../utils/check-file.ts';
import './upload-dropzone.css';

type UploadDropzoneProps = {
  disabled: boolean;
  onFile: (file: File) => void;
};

export function UploadDropzone({ disabled, onFile }: UploadDropzoneProps) {
  const [dragging, setDragging] = useState(false);

  // One file at a time, the first one wins.
  function pick(files: FileList | null) {
    const file = files?.[0];
    if (file && !disabled) onFile(file);
  }

  function handleDragOver(event: DragEvent) {
    // Without this the browser opens the file instead of dropping it here.
    event.preventDefault();
    if (!disabled) setDragging(true);
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    pick(event.dataTransfer.files);
  }

  return (
    <section
      className="upload-dropzone"
      aria-label="Upload a document"
      data-dragging={dragging}
      data-disabled={disabled}
      onDragOver={handleDragOver}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <svg className="upload-dropzone-icon" viewBox="0 0 24 24" aria-hidden>
        <path d="M12 16V4" />
        <path d="M7 9l5-5 5 5" />
        <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
      </svg>
      <p className="upload-dropzone-title">Drag a PDF or DOCX file here</p>
      <label className="upload-dropzone-button" data-disabled={disabled}>
        Choose file
        <input
          type="file"
          accept=".pdf,.docx"
          disabled={disabled}
          onChange={(event) => {
            pick(event.target.files);
            // So picking the same file again still fires onChange.
            event.target.value = '';
          }}
        />
      </label>
      <p className="upload-dropzone-hint">
        PDF or DOCX, up to {MAX_UPLOAD_MB} MB.
      </p>
    </section>
  );
}
