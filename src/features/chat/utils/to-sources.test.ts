import { describe, expect, it } from 'vitest';
import { makeCitation } from '../../../testing/chat-fixtures.ts';
import { citationLocation, toSources } from './to-sources.ts';

describe('citationLocation', () => {
  it('gives the page for a PDF', () => {
    expect(citationLocation(makeCitation({ page: 3, section: '' }))).toBe(
      'Page 3',
    );
  });

  it('gives the heading for a Word file', () => {
    expect(
      citationLocation(makeCitation({ page: null, section: 'Carry over' })),
    ).toBe('Carry over');
  });

  it('gives nothing when there is neither', () => {
    expect(citationLocation(makeCitation({ page: null, section: '' }))).toBe(
      '',
    );
  });
});

describe('toSources', () => {
  it('numbers the citations in order, from 1', () => {
    const sources = toSources([
      makeCitation({ document_title: 'Handbook', document_id: 4 }),
      makeCitation({ document_title: 'Policy', page: null, section: '' }),
    ]);

    expect(sources.map((source) => source.id)).toEqual([1, 2]);
    expect(sources[0]).toMatchObject({
      title: 'Handbook',
      markdown: 'Employees get 20 days of paid leave per year.',
      fileType: 'Page 3',
      documentId: 4,
    });
    // No location, no label
    expect(sources[1].fileType).toBeUndefined();
  });
});
