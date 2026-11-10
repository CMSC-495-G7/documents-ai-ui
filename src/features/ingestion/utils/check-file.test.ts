import { describe, expect, it } from 'vitest';
import { fileOf } from '../../../testing/document-fixtures.ts';
import {
  checkFile,
  MAX_UPLOAD_BYTES,
  SIZE_ERROR,
  TYPE_ERROR,
} from './check-file.ts';

describe('checkFile', () => {
  it('accepts PDF and DOCX files', () => {
    expect(checkFile(fileOf('handbook.pdf'))).toBeNull();
    expect(checkFile(fileOf('handbook.docx'))).toBeNull();
  });

  it('ignores upper and lower case in the extension', () => {
    expect(checkFile(fileOf('SCAN.PDF'))).toBeNull();
    expect(checkFile(fileOf('Notes.Docx'))).toBeNull();
  });

  it('rejects other file types', () => {
    expect(checkFile(fileOf('notes.txt'))).toBe(TYPE_ERROR);
    expect(checkFile(fileOf('old.doc'))).toBe(TYPE_ERROR);
    expect(checkFile(fileOf('handbook'))).toBe(TYPE_ERROR);
  });

  it('looks at the end of the name, not the middle', () => {
    expect(checkFile(fileOf('handbook.pdf.exe'))).toBe(TYPE_ERROR);
  });

  it('rejects files over 16 MB', () => {
    expect(checkFile(fileOf('big.pdf', MAX_UPLOAD_BYTES + 1))).toBe(SIZE_ERROR);
  });

  it('accepts a file right at the limit', () => {
    expect(checkFile(fileOf('big.pdf', MAX_UPLOAD_BYTES))).toBeNull();
  });

  it('says what the limit is', () => {
    expect(SIZE_ERROR).toBe('The file is too big. The limit is 16 MB.');
  });
});
