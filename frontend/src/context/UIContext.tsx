import React, { createContext, useContext, useState, ReactNode } from 'react';
import { SCREENS } from '../data/constants';

interface UIContextType {
    currentScreen: string;
    showScreen: (screenName: string) => void;
    showInventory: boolean;
    setShowInventory: (show: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentScreen, setCurrentScreen] = useState<string>(SCREENS.LOADING);
    const [showInventory, setShowInventory] = useState(false);

    const showScreen = (screenName: string) => {
        setCurrentScreen(screenName);
    };

    return (
        <UIContext.Provider value={{
            currentScreen,
            showScreen,
            showInventory,
            setShowInventory
        }}>
            {children}
        </UIContext.Provider>
    );
};

export const useUIContext = () => {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error('useUIContext must be used within a UIProvider');
    }
    return context;
};
