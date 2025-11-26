import { usePlayerStats } from './usePlayerStats';
import { useGameState } from './useGameState';
import { useGameActions } from './useGameActions';
import { createStatsUpdater } from '../utils/statsHandler';
import { createScreenProps } from '../utils/createScreenProps';
import { gameData } from '../data/gameData';

export const useApp = () => {
  const {
    playerStats,
    updatePlayerStats,
    addToLeaderboard,
    trackPassengerEncounter,
    upgradeKnowledge,
    awardLoreFragments,
    purchaseSkill,
    addToBankBalance
  } = usePlayerStats();

  const {
    gameState,
    updateGameState,
    showInventory,
    setShowInventory,
    showScreen,
    startGame,
    startShift,
    resetGame,
    saveGame,
    loadGame,
    showRideRequest,
    gameOver,
    endShift
  } = useGameState(playerStats);

  const {
    acceptRide,
    declineRide,
    handleDrivingChoice,
    continueToDestination,
    useItem,
    tradeItem,
    processItemEffects: _processItemEffects,
    refuelFull,
    refuelPartial,
    continueFromDropOff
  } = useGameActions({
    gameState,
    setGameState: updateGameState,
    showRideRequest,
    gameOver,
    endShift
  });

  const handleEndShift = (successful: boolean) => {
    const shiftData = endShift(successful);
    const updateStats = createStatsUpdater(playerStats, updatePlayerStats, addToLeaderboard);
    updateStats(shiftData.survived, shiftData);

    // Track all passengers encountered during this shift (always, even on failure)
    if (gameState.usedPassengers && gameState.usedPassengers.length > 0) {
      gameState.usedPassengers.forEach((passengerId: number) => {
        trackPassengerEncounter(passengerId);
      });
    }

    // Award progression rewards based on shift outcome
    if (successful) {
      // Full rewards for successful shift
      const backstoriesThisShift = gameState.passengerBackstories ? Object.keys(gameState.passengerBackstories).length : 0;
      const loreReward = backstoriesThisShift + (gameState.difficultyLevel || 1);
      awardLoreFragments(loreReward);

      // Transfer 20% of earnings to permanent bank balance
      const bankTransfer = Math.floor(gameState.earnings * 0.2);
      addToBankBalance(bankTransfer);
    } else {
      // Consolation rewards for failed shift (50% of what you would have gotten)
      const backstoriesThisShift = gameState.passengerBackstories ? Object.keys(gameState.passengerBackstories).length : 0;
      const loreReward = Math.floor((backstoriesThisShift + (gameState.difficultyLevel || 1)) / 2);
      if (loreReward > 0) {
        awardLoreFragments(loreReward);
      }

      // Small consolation bank transfer (10% instead of 20%)
      const bankTransfer = Math.floor(gameState.earnings * 0.1);
      if (bankTransfer > 0) {
        addToBankBalance(bankTransfer);
      }
    }
  };

  const screenProps = createScreenProps(
    gameState,
    playerStats,
    showInventory,
    setShowInventory,
    {
      startGame,
      loadGame,
      showScreen,
      startShift,
      saveGame,
      handleEndShift,
      acceptRide,
      declineRide,
      handleDrivingChoice,
      continueToDestination,
      gameOver,
      resetGame,
      useItem,
      tradeItem,
      refuelFull,
      refuelPartial,
      continueFromDropOff,
      upgradeKnowledge,
      purchaseSkill,
      allPassengers: gameData.passengers
    }
  );

  return { screenProps };
};