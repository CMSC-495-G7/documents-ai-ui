import { describe, expect, it } from 'vitest';
import { whenLabel } from './when-label.ts';

// Local times, so the tests pass in any time zone
const now = new Date(2026, 10, 16, 9, 0); // Nov 16 2026, 9:00

function at(...parts: [number, number, number, number?, number?]) {
  return new Date(...parts).toISOString();
}

describe('whenLabel', () => {
  it('says Today for earlier today', () => {
    expect(whenLabel(at(2026, 10, 16, 0, 5), now)).toBe('Today');
  });

  it('says Yesterday for any time yesterday', () => {
    expect(whenLabel(at(2026, 10, 15, 23, 59), now)).toBe('Yesterday');
    expect(whenLabel(at(2026, 10, 15, 0, 1), now)).toBe('Yesterday');
  });

  it('shows the month and day for older ones this year', () => {
    expect(whenLabel(at(2026, 10, 3, 12), now)).toBe('Nov 3');
  });

  it('adds the year for another year', () => {
    expect(whenLabel(at(2025, 11, 31, 12), now)).toBe('Dec 31, 2025');
  });
});
