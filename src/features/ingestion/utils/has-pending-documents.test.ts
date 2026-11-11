import { describe, expect, it } from 'vitest';
import { makeDocument } from '../../../testing/document-fixtures.ts';
import { hasPendingDocuments } from './has-pending-documents.ts';

describe('hasPendingDocuments', () => {
  it('is true when a document is queued', () => {
    expect(hasPendingDocuments([makeDocument({ status: 'queued' })])).toBe(
      true,
    );
  });

  it('is true when a document is processing', () => {
    expect(
      hasPendingDocuments([
        makeDocument({ id: 1, status: 'ready' }),
        makeDocument({ id: 2, status: 'processing' }),
      ]),
    ).toBe(true);
  });

  it('is false when everything is ready or failed', () => {
    expect(
      hasPendingDocuments([
        makeDocument({ id: 1, status: 'ready' }),
        makeDocument({ id: 2, status: 'failed' }),
      ]),
    ).toBe(false);
  });

  it('is false for an empty list', () => {
    expect(hasPendingDocuments([])).toBe(false);
  });
});
