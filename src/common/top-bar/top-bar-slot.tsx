import { useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { TopBarContext, useTopBarSlot } from './top-bar-context.ts';

// Wrap the top bar and the page so the page can add buttons to the bar.
export function TopBarProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState<HTMLElement | null>(null);
  const value = useMemo(() => ({ actions, setActions }), [actions]);
  return <TopBarContext value={value}>{children}</TopBarContext>;
}

// Page buttons for the right side of the top bar, like "Cancel" or "New chat".
export function TopBarActions({ children }: { children: ReactNode }) {
  const slot = useTopBarSlot();
  return slot?.actions ? createPortal(children, slot.actions) : null;
}
