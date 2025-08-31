import { useState, useEffect } from 'react';
import type { GameState, PlayerStats, Passenger } from '../types/game';
import type { ShiftData } from '../utils/statsHandler';
import { STORAGE_KEYS, GAME_CONSTANTS, SCREENS, GAME_PHASES } from '../data/constants';
import { ReputationService } from '../services/reputationService';
import { GameEngine } from '../services/gameEngine';
import { PassengerService } from '../services/passengerService';
import { SaveGameService } from '../services/storageService';
import { WeatherService } from '../services/weatherService';
import { gameData } from '../data/gameData';

const getInitialGameState = (): GameState => {
  const season = WeatherService.getCurrentSeason();
  const initialWeather = WeatherService.generateInitialWeather(season);
  
  return {
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
    routeHistory: [],
    // Weather and environmental properties
    currentWeather: initialWeather.success ? initialWeather.data : WeatherService.generateInitialWeather(season).data,
    timeOfDay: WeatherService.updateTimeOfDay(Date.now(), Date.now()),
    season,
    environmentalHazards: [],
    weatherEffects: [],
    // Route mastery and consequence tracking
    routeMastery: { normal: 0, shortcut: 0, scenic: 0, police: 0 },
    routeConsequences: [],
    consecutiveRouteStreak: { type: '', count: 0 }
  };
};

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
    setGameState(prev => ({ 
      ...prev, 
      shiftStartTime: Date.now(),
      fuel: GAME_CONSTANTS.INITIAL_FUEL // Reset fuel to 100% at start of each shift
    }));
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
    SaveGameService.clearSave();
  };

  const getRandomPassenger = (): Passenger | null => {
    return PassengerService.getRandomPassenger(
      gameData.passengers,
      gameState.usedPassengers,
      gameState.difficultyLevel || 1
    );
  };

  const showRideRequest = () => {
    // Don't show new ride request if in active phases (but allow if transitioning from dropOff)
    if (gameState.currentPassenger && 
        gameState.gamePhase !== GAME_PHASES.DROP_OFF && 
        gameState.gamePhase !== GAME_PHASES.WAITING) {
      console.log('showRideRequest blocked - active passenger:', {
        hasPassenger: !!gameState.currentPassenger,
        gamePhase: gameState.gamePhase
      });
      return;
    }
    
    console.log('showRideRequest proceeding - current state:', {
      gamePhase: gameState.gamePhase,
      hasPassenger: !!gameState.currentPassenger
    });
    
    // Update weather and environmental conditions
    updateWeatherAndEnvironment();
    
    // Check if all passengers have been used and reset if necessary
    const availablePassengers = gameData.passengers.filter(
      passenger => !gameState.usedPassengers.includes(passenger.id)
    );
    
    // If no passengers available, either reset the used passenger list or select from all
    let currentUsedPassengers = gameState.usedPassengers;
    if (availablePassengers.length === 0) {
      // Allow passengers to repeat after all have been used once
      currentUsedPassengers = [];
    }
    
    // Use weather-aware passenger selection
    const passengerResult = PassengerService.selectWeatherAwarePassenger(
      currentUsedPassengers,
      gameState.difficultyLevel || 1,
      gameState.currentWeather,
      gameState.timeOfDay,
      gameState.season
    );
    
    let passenger = passengerResult.success ? passengerResult.data : null;
    
    // If weather-aware selection fails, use fallback selection
    if (!passenger) {
      passenger = PassengerService.getRandomPassenger(
        gameData.passengers,
        currentUsedPassengers,
        gameState.difficultyLevel || 1
      );
    }
    
    // If we still don't have a passenger, force select one from all available
    if (!passenger && gameData.passengers.length > 0) {
      passenger = gameData.passengers[Math.floor(Math.random() * gameData.passengers.length)];
    }
    
    // Only end shift if there are truly no passengers available (should never happen)
    if (!passenger) {
      console.warn('No passengers available - this should never happen');
      endShift(false);
      return;
    }

    // Apply weather-triggered rules
    const weatherTriggeredRules = WeatherService.getWeatherTriggeredRules(
      gameState.currentWeather, 
      gameState.timeOfDay
    );
    
    setGameState(prev => ({
      ...prev,
      currentPassenger: passenger,
      gamePhase: GAME_PHASES.RIDE_REQUEST,
      usedPassengers: [...currentUsedPassengers, passenger.id],
      // Add weather-triggered rules to current rules
      currentRules: [
        ...prev.currentRules,
        ...gameData.shift_rules.filter(rule => weatherTriggeredRules.includes(rule.id))
      ]
    }));
  };

  const updateWeatherAndEnvironment = () => {
    const currentTime = Date.now();
    
    setGameState(prev => {
      // Update time of day
      const newTimeOfDay = prev.shiftStartTime 
        ? WeatherService.updateTimeOfDay(prev.shiftStartTime, currentTime)
        : prev.timeOfDay;
      
      // Update weather
      const weatherUpdateResult = WeatherService.updateWeather(
        prev.currentWeather,
        currentTime,
        prev.season
      );
      const newWeather = weatherUpdateResult.success ? weatherUpdateResult.data : prev.currentWeather;
      
      // Generate environmental hazards
      const hazardsResult = WeatherService.generateEnvironmentalHazards(
        newWeather,
        newTimeOfDay,
        prev.season
      );
      const newHazards = hazardsResult.success ? hazardsResult.data : [];
      
      // Filter out expired hazards
      const activeHazards = prev.environmentalHazards.filter(hazard => {
        const elapsed = (currentTime - hazard.startTime) / (60 * 1000); // minutes
        return elapsed < hazard.duration;
      });
      
      return {
        ...prev,
        timeOfDay: newTimeOfDay,
        currentWeather: newWeather,
        environmentalHazards: [...activeHazards, ...newHazards],
        weatherEffects: newWeather.effects
      };
    });
  };

  const gameOver = (reason: string) => {
    setGameState(prev => ({ 
      ...prev, 
      rulesViolated: prev.rulesViolated + 1,
      gameOverReason: reason
    }));
    showScreen(SCREENS.GAME_OVER);
  };

  const endShift = (successful: boolean): ShiftData => {
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

    const finalEarningsForScore = actuallySuccessful ? gameState.earnings + GAME_CONSTANTS.SURVIVAL_BONUS : gameState.earnings;
    const calculatedScore = finalEarningsForScore + (gameState.ridesCompleted * 10) - ((gameState.rulesViolated || 0) * 5);

    return {
      earnings: finalEarningsForScore,
      ridesCompleted: gameState.ridesCompleted,
      timeSpent: shiftDuration,
      survived: actuallySuccessful,
      rulesViolated: gameState.rulesViolated || 0,
      passengersEncountered: gameState.usedPassengers.length,
      difficultyLevel: gameState.difficultyLevel || 0,
      score: calculatedScore
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