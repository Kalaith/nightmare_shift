import React, { ReactNode } from 'react';
import { usePlayerStats } from '../hooks/usePlayerStats';
import { PlayerContext } from './playerContextObject';

export const PlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const playerStatsLogic = usePlayerStats();

  return <PlayerContext.Provider value={playerStatsLogic}>{children}</PlayerContext.Provider>;
};
