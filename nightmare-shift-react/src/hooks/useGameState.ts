import { useState, useEffect } from 'react';
import type { GameState, PlayerStats, Passenger } from '../types/game';
import { STORAGE_KEYS, GAME_CONSTANTS, SCREENS, GAME_PHASES } from '../data/constants';
import { ReputationService } from '../services/reputationService';
import { GameEngine } from '../services/gameEngine';
import { PassengerService } from '../services/passengerService';
import { SaveGameService } from '../services/storageService';
import { gameData } from '../data/gameData';

const getInitialGameState = (): GameState => ({
  currentScreen: SCREENS.LOADING,
  fuel: GAME_CONSTANTS.INITIAL_FUEL,
  earnings: 0,
  timeRemaining: GAME_CONSTANTS.INITIAL_TIME,
  ridesCompleted: 0,
  rulesViolated: 0,
  currentRules: [],
  inventory: [],
  currentPassenger: null,
  currentRide: null,
  gamePhase: GAME_PHASES.WAITING,
  usedPassengers: [],
  shiftStartTime: null,
  sessionStartTime: Date.now(),
  passengerReputation: ReputationService.initializeReputation(),
  minimumEarnings: GAME_CONSTANTS.MINIMUM_EARNINGS,
  routeHistory: []
});

export const useGameState = (playerStats: PlayerStats) => {
  const [gameState, setGameState] = useState<GameState>(getInitialGameState);
  const [showInventory, setShowInventory] = useState(false);

  // Game timer effect
  useEffect(() => {
    if (gameState.currentScreen !== SCREENS.GAME || gameState.gamePhase === GAME_PHASES.WAITING) {
      return;
    }

    const timer = setInterval(() => {
      setGameState(prev => {
        const newTime = prev.timeRemaining - 1;
        if (newTime <= 0) {
          setTimeout(() => endShift(false), 100);
        }
        return { ...prev, timeRemaining: newTime };
      });
    }, 30000);

    return () => clearInterval(timer);
  }, [gameState.currentScreen, gameState.timeRemaining]);

  const showScreen = (screenName: string) => {
    setGameState(prev => ({ ...prev, currentScreen: screenName }));
  };

  const generateShiftRules = () => {
    const engineResult = GameEngine.generateShiftRules(gameData.shift_rules);
    setGameState(prev => ({
      ...prev,
      currentRules: engineResult.visibleRules,
      hiddenRules: engineResult.hiddenRules,
      difficultyLevel: engineResult.difficultyLevel
    }));
  };

  const startGame = () => {
    generateShiftRules();
    showScreen(SCREENS.BRIEFING);
  };

  const startShift = () => {
    setGameState(prev => ({ ...prev, shiftStartTime: Date.now() }));
    showScreen(SCREENS.GAME);
    setTimeout(() => showRideRequest(), 2000 + Math.random() * 3000);
  };

  const resetGame = () => {
    setGameState(getInitialGameState());
  };

  const saveGame = () => {
    SaveGameService.saveGame({
      gameState,
      playerStats,
      timestamp: Date.now(),
      version: '1.0.0'
    });
    setGameState(prev => ({ ...prev, showSaveNotification: true }));
    setTimeout(() => {
      setGameState(prev => ({ ...prev, showSaveNotification: false }));
    }, 2000);
  };

  const loadGame = () => {
    const savedData = SaveGameService.loadGame();
    if (savedData) {
      setGameState(savedData.gameState);
      showScreen(SCREENS.GAME);
    }
  };

  const deleteSavedGame = () => {
    SaveGameService.deleteSavedGame();
  };

  const getRandomPassenger = (): Passenger | null => {
    return PassengerService.getRandomPassenger(
      gameData.passengers,
      gameState.usedPassengers,
      gameState.difficultyLevel || 1
    );
  };

  const showRideRequest = () => {
    const passenger = getRandomPassenger();
    if (!passenger) {
      endShift(true);
      return;
    }
    
    setGameState(prev => ({
      ...prev,
      currentPassenger: passenger,
      gamePhase: GAME_PHASES.RIDE_REQUEST,
      usedPassengers: [...prev.usedPassengers, passenger.id]
    }));
  };

  const gameOver = (reason: string) => {
    setGameState(prev => ({ 
      ...prev, 
      rulesViolated: prev.rulesViolated + 1,
      gameOverReason: reason
    }));
    showScreen(SCREENS.GAME_OVER);
  };

  const endShift = (successful: boolean) => {
    const shiftEndTime = Date.now();
    const shiftDuration = gameState.shiftStartTime ? 
      Math.round((shiftEndTime - gameState.shiftStartTime) / (1000 * 60)) : 0;

    // Check if minimum earnings requirement was met
    const earnedEnough = gameState.earnings >= gameState.minimumEarnings;
    const actuallySuccessful = successful && earnedEnough;

    if (actuallySuccessful) {
      const survivalBonus = GAME_CONSTANTS.SURVIVAL_BONUS;
      const finalEarnings = gameState.earnings + survivalBonus;

      setGameState(prev => ({ 
        ...prev, 
        earnings: finalEarnings,
        survivalBonus
      }));

      deleteSavedGame();
      showScreen(SCREENS.SUCCESS);
    } else {
      // Determine failure reason
      let failureReason: string;
      if (!successful) {
        failureReason = "Time ran out or you ran out of fuel. The night shift waits for no one...";
      } else if (!earnedEnough) {
        failureReason = `Shift failed: You only earned $${gameState.earnings} but needed $${gameState.minimumEarnings}. The company expects better performance.`;
      } else {
        failureReason = "The night shift has ended in failure...";
      }
      
      gameOver(failureReason);
    }

    return {
      earnings: actuallySuccessful ? gameState.earnings + GAME_CONSTANTS.SURVIVAL_BONUS : gameState.earnings,
      ridesCompleted: gameState.ridesCompleted,
      timeSpent: shiftDuration,
      successful: actuallySuccessful,
      rulesViolated: gameState.rulesViolated || 0,
      passengersEncountered: gameState.usedPassengers.length,
      difficultyLevel: gameState.difficultyLevel || 0
    };
  };

  // Expose setGameState for game actions
  const updateGameState = (updater: React.SetStateAction<GameState>) => {
    setGameState(updater);
  };

  return {
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
  };
};