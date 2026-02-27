import React, { ReactNode, useMemo } from 'react';
import { usePlayerStats } from '../hooks/usePlayerStats';
import { useAuthSession } from '../hooks/useAuthSession';
import { PlayerContext } from './playerContextObject';

export const PlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const authSession = useAuthSession();
  const playerStatsLogic = usePlayerStats();

  const value = useMemo(() => ({
    // Auth session
    user: authSession.user,
    isAuthenticated: authSession.isAuthenticated,
    isLoading: authSession.isLoading,
    authError: authSession.error,
    refreshSession: authSession.refreshSession,
    // Player stats
    ...playerStatsLogic,
  }), [authSession, playerStatsLogic]);

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
};
