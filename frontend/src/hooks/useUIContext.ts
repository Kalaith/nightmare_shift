import { useContext } from 'react';
import { UIContext } from '../context/uiContextObject';

export const useUIContext = () => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUIContext must be used within a UIProvider');
  }
  return context;
};
