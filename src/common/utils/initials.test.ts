import { describe, expect, it } from 'vitest';
import { initials } from './initials.ts';

describe('initials', () => {
  it('uses the first two parts of the name', () => {
    expect(initials('priya.n@acme.example')).toBe('PN');
    expect(initials('kofi_a@acme.example')).toBe('KA');
  });

  it('uses the first two letters for a one-part name', () => {
    expect(initials('admin@acme.example')).toBe('AD');
  });

  it('falls back to ? for an empty name', () => {
    expect(initials('@acme.example')).toBe('?');
  });
});
