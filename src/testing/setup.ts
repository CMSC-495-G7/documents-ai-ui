import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { FakeXhr } from './fake-xhr.ts';

beforeEach(() => {
  vi.stubGlobal('XMLHttpRequest', FakeXhr);
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllGlobals();
});
