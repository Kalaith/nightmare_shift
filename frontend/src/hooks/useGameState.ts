import { useState, useEffect, useRef, useMemo, type SetStateAction } from 'react';
import type { GameState, PlayerStats } from '../types/game';
import type { ShiftData } from '../utils/statsHandler';
import { GAME_CONSTANTS, SCREENS, GAME_PHASES } from '../data/constants';
import { ReputationService } from '../services/reputationService';
import { GameEngine } from '../services/gameEngine';
import { PassengerService } from '../services/passengerService';
import { PassengerStateMachine } from '../services/passengerStateMachine';
import { SaveGameService } from '../services/storageService';
import { WeatherService } from '../services/weatherService';
import { gameData } from '../data/gameData';
import { useUIContext } from './useUIContext';

const getInitialGameState = (): Omit<GameState, 'currentScreen'> => {
  const season = WeatherService.getCurrentSeason();
  const initialWeather = WeatherService.generateInitialWeather(season);

  return {
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
    currentWeather: initialWeather.success
      ? initialWeather.data
      : {
          type: 'clear',
          intensity: 'light',
          description: 'A calm night with clear skies',
          visibility: 100,
          icon: '🌙',
          effects: [],
          duration: 120,
          startTime: Date.now(),
        },
    timeOfDay: WeatherService.updateTimeOfDay(Date.now(), Date.now()),
    season,
    environmentalHazards: [],
    weatherEffects: [],
    // Route mastery and consequence tracking
    routeMastery: { normal: 0, shortcut: 0, scenic: 0, police: 0 },
    routeConsequences: [],
    consecutiveRouteStreak: { type: '', count: 0 },
    detectedTells: [],
    ruleConfidence: 0.5,
    currentPassengerNeedState: null,
  };
};

export const useGameState = (playerStats: PlayerStats) => {
  // We cast the initial state to GameState internally, but we'll override currentScreen
  const [localGameState, setLocalGameState] =
    useState<Omit<GameState, 'currentScreen'>>(getInitialGameState);

  const { currentScreen, showScreen, showInventory, setShowInventory } = useUIContext();

  // Construct the full GameState object by merging local state with UI context state
  const gameState: GameState = useMemo(
    () =>
      ({
        ...localGameState,
        currentScreen,
      }) as GameState,
    [localGameState, currentScreen]
  );

  // Ref to access latest game state in async callbacks
  const gameStateRef = useRef(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Game timer effect
  useEffect(() => {
    if (currentScreen !== SCREENS.GAME || gameState.gamePhase === GAME_PHASES.WAITING) {
      return;
    }

    const timer = setInterval(() => {
      setLocalGameState(prev => {
        const newTime = prev.timeRemaining - 1;
        if (newTime <= 0) {
          setTimeout(() => {
            setLocalGameState(current => ({
              ...current,
              rulesViolated: current.rulesViolated + 1,
              gameOverReason:
                'Time ran out or you ran out of fuel. The night shift waits for no one...',
            }));
            showScreen(SCREENS.GAME_OVER);
          }, 100);
        }
        return { ...prev, timeRemaining: newTime };
      });
    }, 30000);

    return () => clearInterval(timer);
  }, [currentScreen, gameState.gamePhase, showScreen]);

  const generateShiftRules = () => {
    const engineResult = GameEngine.generateShiftRules(playerStats.totalShiftsCompleted || 0);
    setLocalGameState(prev => ({
      ...prev,
      currentRules: engineResult.visibleRules,
      hiddenRules: engineResult.hiddenRules,
      difficultyLevel: engineResult.difficultyLevel,
    }));
  };

  const startGame = () => {
    generateShiftRules();
    showScreen(SCREENS.BRIEFING);
  };

  const startShift = () => {
    setLocalGameState(prev => ({
      ...prev,
      shiftStartTime: Date.now(),
      fuel: GAME_CONSTANTS.INITIAL_FUEL, // Reset fuel to 100% at start of each shift
    }));
    showScreen(SCREENS.GAME);
    setTimeout(() => showRideRequest(), 2000 + Math.random() * 3000);
  };

  const resetGame = () => {
    setLocalGameState(getInitialGameState());
    // Note: We don't reset screen here as that might be handled by the caller or UI context
  };

  const saveGame = () => {
    SaveGameService.saveGame({
      gameState,
      playerStats,
      timestamp: Date.now(),
      version: '1.0.0',
    });
    setLocalGameState(prev => ({ ...prev, showSaveNotification: true }));
    setTimeout(() => {
      setLocalGameState(prev => ({ ...prev, showSaveNotification: false }));
    }, 2000);
  };

  const loadGame = () => {
    const savedData = SaveGameService.loadGame();
    if (savedData) {
      // We need to separate currentScreen from the saved state if it exists
      const { currentScreen: savedScreen, ...rest } = savedData.gameState;
      setLocalGameState(rest);
      if (savedScreen) {
        showScreen(SCREENS.GAME); // Always go to game on load? Or savedScreen?
        // Original code: showScreen(SCREENS.GAME);
      } else {
        showScreen(SCREENS.GAME);
      }
    }
  };

  const deleteSavedGame = () => {
    SaveGameService.clearSave();
  };

  const showRideRequest = () => {
    const currentGameState = gameStateRef.current;

    // Don't show new ride request if in active phases (but allow if transitioning from dropOff)
    if (
      currentGameState.currentPassenger &&
      currentGameState.gamePhase !== GAME_PHASES.DROP_OFF &&
      currentGameState.gamePhase !== GAME_PHASES.WAITING
    ) {
      return;
    }

    // Update weather and environmental conditions
    updateWeatherAndEnvironment();

    // Check if all passengers have been used and reset if necessary
    const availablePassengers = gameData.passengers.filter(
      passenger => !currentGameState.usedPassengers.includes(passenger.id)
    );

    // If no passengers available, either reset the used passenger list or select from all
    let currentUsedPassengers = currentGameState.usedPassengers;
    if (availablePassengers.length === 0) {
      // Allow passengers to repeat after all have been used once
      currentUsedPassengers = [];
    }

    // Use weather-aware passenger selection
    const passengerResult = PassengerService.selectWeatherAwarePassenger(
      currentUsedPassengers,
      currentGameState.difficultyLevel || 1,
      currentGameState.currentWeather,
      currentGameState.timeOfDay,
      currentGameState.season
    );

    let passenger = passengerResult.success ? passengerResult.data : null;

    // If weather-aware selection fails, use fallback selection
    if (!passenger) {
      passenger = PassengerService.getRandomPassenger(
        gameData.passengers,
        currentUsedPassengers,
        currentGameState.difficultyLevel || 1
      );
    }

    // If we still don't have a passenger, force select one from all available
    if (!passenger && gameData.passengers.length > 0) {
      passenger = gameData.passengers[Math.floor(Math.random() * gameData.passengers.length)];
    }

    // Only end shift if there are truly no passengers available (should never happen)
    if (!passenger) {
      endShift(false);
      return;
    }

    // Apply weather-triggered rules
    const weatherTriggeredRules = WeatherService.getWeatherTriggeredRules(
      currentGameState.currentWeather,
      currentGameState.timeOfDay
    );

    const passengerNeedState = PassengerStateMachine.initialize(passenger);

    setLocalGameState(prev => ({
      ...prev,
      currentPassenger: passenger,
      gamePhase: GAME_PHASES.RIDE_REQUEST,
      usedPassengers: [...currentUsedPassengers, passenger.id],
      // Add weather-triggered rules to current rules
      currentRules: [
        ...prev.currentRules,
        ...gameData.shift_rules.filter(rule => weatherTriggeredRules.includes(rule.id)),
      ],
      currentPassengerNeedState: passengerNeedState,
      detectedTells: prev.detectedTells || [],
    }));
  };

  const updateWeatherAndEnvironment = () => {
    const currentTime = Date.now();

    setLocalGameState(prev => {
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
      const newWeather = weatherUpdateResult.success
        ? weatherUpdateResult.data
        : prev.currentWeather;

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
        weatherEffects: newWeather.effects,
      };
    });
  };

  const gameOver = (reason: string) => {
    setLocalGameState(prev => ({
      ...prev,
      rulesViolated: prev.rulesViolated + 1,
      gameOverReason: reason,
    }));
    showScreen(SCREENS.GAME_OVER);
  };

  const endShift = (successful: boolean, overrideReason?: string): ShiftData => {
    const shiftEndTime = Date.now();
    const shiftDuration = gameState.shiftStartTime
      ? Math.round((shiftEndTime - gameState.shiftStartTime) / (1000 * 60))
      : 0;

    // Check if minimum earnings requirement was met
    const earnedEnough = gameState.earnings >= gameState.minimumEarnings;
    const actuallySuccessful = successful && earnedEnough;

    if (actuallySuccessful) {
      const survivalBonus = GAME_CONSTANTS.SURVIVAL_BONUS;
      const finalEarnings = gameState.earnings + survivalBonus;

      setLocalGameState(prev => ({
        ...prev,
        earnings: finalEarnings,
        survivalBonus,
      }));

      deleteSavedGame();
      showScreen(SCREENS.SUCCESS);
    } else {
      // Determine failure reason
      let failureReason: string;
      if (overrideReason) {
        failureReason = overrideReason;
      } else if (!successful) {
        failureReason = 'Time ran out or you ran out of fuel. The night shift waits for no one...';
      } else if (!earnedEnough) {
        failureReason = `Shift failed: You only earned $${gameState.earnings} but needed $${gameState.minimumEarnings}. The company expects better performance.`;
      } else {
        failureReason = 'The night shift has ended in failure...';
      }

      gameOver(failureReason);
    }

    const finalEarningsForScore = actuallySuccessful
      ? gameState.earnings + GAME_CONSTANTS.SURVIVAL_BONUS
      : gameState.earnings;
    const calculatedScore =
      finalEarningsForScore + gameState.ridesCompleted * 10 - (gameState.rulesViolated || 0) * 5;

    return {
      earnings: finalEarningsForScore,
      ridesCompleted: gameState.ridesCompleted,
      timeSpent: shiftDuration,
      survived: actuallySuccessful,
      rulesViolated: gameState.rulesViolated || 0,
      passengersEncountered: gameState.usedPassengers.length,
      difficultyLevel: gameState.difficultyLevel || 0,
      score: calculatedScore,
    };
  };

  // Expose setGameState for game actions
  // We need to be careful here. If updater tries to set currentScreen, it will be ignored by local state
  // But since we are merging it back in the return, it should be fine as long as we don't expect setGameState to update screen
  const updateGameState = (updater: SetStateAction<GameState>) => {
    setLocalGameState(prev => {
      // If updater is a function, call it with the FULL state (including screen)
      // but only use the result to update local state (excluding screen)
      const fullPrev: GameState = { ...prev, currentScreen } as GameState;
      const result = typeof updater === 'function' ? updater(fullPrev) : updater;

      const { currentScreen: ignoredCurrentScreen, ...rest } = result;
      void ignoredCurrentScreen;
      return rest;
    });
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
    endShift,
  };
};
