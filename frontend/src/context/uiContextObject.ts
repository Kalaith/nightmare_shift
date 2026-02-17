import { createContext } from 'react';

export interface UIContextType {
  currentScreen: string;
  showScreen: (screenName: string) => void;
  showInventory: boolean;
  setShowInventory: (show: boolean) => void;
}

export const UIContext = createContext<UIContextType | undefined>(undefined);
