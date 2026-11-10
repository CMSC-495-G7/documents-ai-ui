import { createContext, useContext } from 'react';

type TopBarSlot = {
  actions: HTMLElement | null;
  setActions: (element: HTMLElement | null) => void;
};

export const TopBarContext = createContext<TopBarSlot | null>(null);

export function useTopBarSlot() {
  return useContext(TopBarContext);
}
