import { usePlayerStats } from './usePlayerStats';
import { useGameState } from './useGameState';
import { useGameActions } from './useGameActions';
import { createStatsUpdater } from '../utils/statsHandler';
import { createScreenProps } from '../utils/createScreenProps';

export const useApp = () => {
  const { playerStats, updatePlayerStats, addToLeaderboard } = usePlayerStats();
  
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

  const { acceptRide, declineRide, handleDrivingChoice, continueToDestination } = useGameActions({
    gameState,
    setGameState: updateGameState,
    showRideRequest,
    gameOver,
    endShift
  });

  const handleEndShift = (successful: boolean) => {
    const shiftData = endShift(successful);
    const updateStats = createStatsUpdater(playerStats, updatePlayerStats, addToLeaderboard);
    updateStats(shiftData.successful, shiftData);
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
      resetGame
    }
  );

  return { screenProps };
};