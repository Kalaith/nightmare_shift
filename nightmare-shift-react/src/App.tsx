import React from 'react';
import './App.css';
import { useApp } from './hooks/useApp';
import ScreenRouter from './components/ScreenRouter';

const App: React.FC = () => {
  const { screenProps } = useApp();
  
  return (
    <div>
      <ScreenRouter {...screenProps} />
    </div>
  );
};

export default App;