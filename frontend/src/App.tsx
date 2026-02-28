import React from 'react';
import './App.css';
import ScreenRouter from './components/ScreenRouter';
import { PlayerProvider } from './context/PlayerContext';
import { GameProvider } from './context/GameContext';
import { UIProvider } from './context/UIContext';

const App: React.FC = () => {
  return (
    <PlayerProvider>
      <UIProvider>
        <GameProvider>
          <div>
            <ScreenRouter />
          </div>
        </GameProvider>
      </UIProvider>
    </PlayerProvider>
  );
};

export default App;
