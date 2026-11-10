import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { fileOf } from '../../../testing/document-fixtures.ts';
import { UploadDropzone } from './upload-dropzone.tsx';

function zone() {
  return screen.getByRole('region', { name: 'Upload a document' });
}

describe('UploadDropzone', () => {
  it('hands over a picked file', async () => {
    const onFile = vi.fn();
    render(<UploadDropzone disabled={false} onFile={onFile} />);
    const file = fileOf('handbook.pdf');

    await userEvent.upload(screen.getByLabelText('Choose file'), file);
    expect(onFile).toHaveBeenCalledWith(file);
  });

  it('hands over a dropped file', () => {
    const onFile = vi.fn();
    render(<UploadDropzone disabled={false} onFile={onFile} />);
    const file = fileOf('handbook.docx');

    fireEvent.drop(zone(), { dataTransfer: { files: [file] } });
    expect(onFile).toHaveBeenCalledWith(file);
  });

  it('only takes the first of several dropped files', () => {
    const onFile = vi.fn();
    render(<UploadDropzone disabled={false} onFile={onFile} />);
    const first = fileOf('a.pdf');

    fireEvent.drop(zone(), {
      dataTransfer: { files: [first, fileOf('b.pdf')] },
    });
    expect(onFile).toHaveBeenCalledOnce();
    expect(onFile).toHaveBeenCalledWith(first);
  });

  it('highlights while a file is dragged over it', () => {
    render(<UploadDropzone disabled={false} onFile={vi.fn()} />);

    fireEvent.dragOver(zone());
    expect(zone()).toHaveAttribute('data-dragging', 'true');
    fireEvent.dragLeave(zone());
    expect(zone()).toHaveAttribute('data-dragging', 'false');
  });

  it('ignores files while disabled', () => {
    const onFile = vi.fn();
    render(<UploadDropzone disabled onFile={onFile} />);

    expect(screen.getByLabelText('Choose file')).toBeDisabled();
    fireEvent.drop(zone(), { dataTransfer: { files: [fileOf('a.pdf')] } });
    expect(onFile).not.toHaveBeenCalled();
  });

  it('shows the size limit', () => {
    render(<UploadDropzone disabled={false} onFile={vi.fn()} />);
    expect(screen.getByText('PDF or DOCX, up to 16 MB.')).toBeInTheDocument();
  });
});
