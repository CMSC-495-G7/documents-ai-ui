import { useEffect, useState } from 'react';
import { getAnswer } from '../api/get-answer.ts';
import type { AskAnswer } from '../types.ts';

type SavedAnswer =
  | { state: 'none' }
  | { state: 'loading' }
  | { state: 'loaded'; answer: AskAnswer }
  | { state: 'failed'; error: unknown };

// Loads the answer in /chat/:answerId. Nothing to load on /chat.
export function useSavedAnswer(answerId: number | null) {
  const [saved, setSaved] = useState<SavedAnswer>(() =>
    answerId === null ? { state: 'none' } : { state: 'loading' },
  );
  const loading = saved.state === 'loading';

  // Runs on open and again on Retry
  useEffect(() => {
    if (answerId === null || !loading) return;
    let cancelled = false;
    getAnswer(answerId).then(
      (answer) => {
        if (!cancelled) setSaved({ state: 'loaded', answer });
      },
      (error: unknown) => {
        if (!cancelled) setSaved({ state: 'failed', error });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [answerId, loading]);

  function retry() {
    setSaved({ state: 'loading' });
  }

  return { saved, retry };
}
