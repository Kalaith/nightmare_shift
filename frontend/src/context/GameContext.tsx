import React, { ReactNode } from 'react';
import { useGameState } from '../hooks/useGameState';
import { usePlayerContext } from '../hooks/usePlayerContext';
import { GameContext } from './gameContextObject';
import { createStatsUpdater } from '../utils/statsHandler';

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const {
    playerStats,
    updatePlayerStats,
    addToLeaderboard,
    refreshStats,
  } = usePlayerContext();

  const gameStateLogic = useGameState(playerStats);

  const handleEndShift = async (successful: boolean, overrideReason?: string) => {
    const shiftData = await gameStateLogic.endShift(successful, overrideReason);
    const updateStats = createStatsUpdater(playerStats, updatePlayerStats, addToLeaderboard);
    updateStats(shiftData.survived, shiftData);
    await refreshStats();
  };

  return (
    <GameContext.Provider
      value={{
        ...gameStateLogic,
        endShift: handleEndShift,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};
