import { useCallback, useEffect, useState } from 'react';
import { getHistory } from '../api/get-history.ts';
import type { HistoryItem } from '../types.ts';

// The history sidebar's list. reload() gets it again, like after a new answer.
export function useAnswerHistory() {
  const [items, setItems] = useState<HistoryItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  // true when the list should be fetched (again)
  const [stale, setStale] = useState(true);

  useEffect(() => {
    if (!stale) return;
    let cancelled = false;
    getHistory().then(
      (latest) => {
        if (cancelled) return;
        setItems(latest);
        setFailed(false);
        setStale(false);
      },
      () => {
        if (cancelled) return;
        // Keeps the old list if there is one
        setFailed(true);
        setStale(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [stale]);

  const reload = useCallback(() => {
    setFailed(false);
    setStale(true);
  }, []);

  return { items, failed, reload };
}
