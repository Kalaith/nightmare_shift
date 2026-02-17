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
    trackPassengerEncounter,
    awardLoreFragments,
    addToBankBalance,
  } = usePlayerContext();

  const gameStateLogic = useGameState(playerStats);

  const handleEndShift = (successful: boolean, overrideReason?: string) => {
    const shiftData = gameStateLogic.endShift(successful, overrideReason);
    const updateStats = createStatsUpdater(playerStats, updatePlayerStats, addToLeaderboard);
    updateStats(shiftData.survived, shiftData);

    // Track all passengers encountered during this shift (always, even on failure)
    if (
      gameStateLogic.gameState.usedPassengers &&
      gameStateLogic.gameState.usedPassengers.length > 0
    ) {
      gameStateLogic.gameState.usedPassengers.forEach((passengerId: number) => {
        trackPassengerEncounter(passengerId);
      });
    }

    // Award progression rewards based on shift outcome
    if (successful) {
      // Full rewards for successful shift
      const backstoriesThisShift = gameStateLogic.gameState.passengerBackstories
        ? Object.keys(gameStateLogic.gameState.passengerBackstories).length
        : 0;
      const loreReward = backstoriesThisShift + (gameStateLogic.gameState.difficultyLevel || 1);
      awardLoreFragments(loreReward);

      // Transfer 20% of earnings to permanent bank balance
      // Use shiftData.earnings as it includes the survival bonus
      const bankTransfer = Math.floor(shiftData.earnings * 0.2);
      addToBankBalance(bankTransfer);
    } else {
      // Consolation rewards for failed shift (50% of what you would have gotten)
      const backstoriesThisShift = gameStateLogic.gameState.passengerBackstories
        ? Object.keys(gameStateLogic.gameState.passengerBackstories).length
        : 0;
      const loreReward = Math.floor(
        (backstoriesThisShift + (gameStateLogic.gameState.difficultyLevel || 1)) / 2
      );
      if (loreReward > 0) {
        awardLoreFragments(loreReward);
      }

      // Small consolation bank transfer (10% instead of 20%)
      // Use shiftData.earnings as it includes any partial earnings
      const bankTransfer = Math.floor(shiftData.earnings * 0.1);
      if (bankTransfer > 0) {
        addToBankBalance(bankTransfer);
      }
    }
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
