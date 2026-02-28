import React, { useEffect } from 'react';
import './App.css';
import ScreenRouter from './components/ScreenRouter';
import { PlayerProvider } from './context/PlayerContext';
import { GameProvider } from './context/GameContext';
import { UIProvider } from './context/UIContext';
import { loadGameContent } from './data/gameData';

const App: React.FC = () => {
  // Load game content from the backend on mount.
  // Falls back to hardcoded data per-category if any fetch fails.
  useEffect(() => {
    loadGameContent();
  }, []);

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
