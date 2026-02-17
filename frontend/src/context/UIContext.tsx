import React, { useState, ReactNode } from 'react';
import { SCREENS } from '../data/constants';
import { UIContext } from './uiContextObject';

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentScreen, setCurrentScreen] = useState<string>(SCREENS.LOADING);
  const [showInventory, setShowInventory] = useState(false);

  const showScreen = (screenName: string) => {
    setCurrentScreen(screenName);
  };

  return (
    <UIContext.Provider
      value={{
        currentScreen,
        showScreen,
        showInventory,
        setShowInventory,
      }}
    >
      {children}
    </UIContext.Provider>
  );
};
