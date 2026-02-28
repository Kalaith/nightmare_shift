import { useState, useEffect, useRef, useMemo, useCallback, type SetStateAction } from 'react';
import type { GameState, PlayerStats } from '../types/game';
import type { ShiftData } from '../utils/statsHandler';
import { SCREENS, GAME_PHASES } from '../data/constants';
import { gameApi } from '../api/gameApi';
import { useUIContext } from './useUIContext';

/**
 * Default empty game state for initialization before backend responds.
 */
const getInitialGameState = (): Omit<GameState, 'currentScreen'> => ({
  fuel: 100,
  earnings: 0,
  timeRemaining: 600,
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
  passengerReputation: {},
  minimumEarnings: 30,
  routeHistory: [],
  currentWeather: {
    type: 'clear',
    intensity: 'light',
    description: 'A calm night with clear skies',
    visibility: 100,
    icon: '🌙',
    effects: [],
    duration: 120,
    startTime: Date.now(),
  },
  timeOfDay: { phase: 'night', hour: 22, description: 'Night', ambientLight: 15, supernaturalActivity: 70 },
  season: { type: 'fall', month: 10, temperature: 'cool', description: 'Fall — cool temperatures', passengerModifiers: { spawnRates: {}, behaviorChanges: {} } },
  environmentalHazards: [],
  weatherEffects: [],
  routeMastery: { normal: 0, shortcut: 0, scenic: 0, police: 0 },
  routeConsequences: [],
  consecutiveRouteStreak: { type: '', count: 0 },
  detectedTells: [],
  ruleConfidence: 0.5,
  currentPassengerNeedState: null,
});

export const useGameState = (playerStats: PlayerStats) => {
  const [localGameState, setLocalGameState] =
    useState<Omit<GameState, 'currentScreen'>>(getInitialGameState);
  const [isLoading, setIsLoading] = useState(false);

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



  // Game timer effect — frontend still tracks time for UI responsiveness
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

  /**
   * Apply a backend game state response to local state.
   * Strips currentScreen (managed by UI context) and merges the rest.
   */
  const applyBackendState = useCallback((backendState: GameState) => {
    const { currentScreen: _ignored, ...rest } = backendState as GameState & { currentScreen?: string };
    void _ignored;
    setLocalGameState(rest);
  }, []);

  // Auto-resume: check for an active shift on mount
  const hasCheckedSave = useRef(false);
  useEffect(() => {
    if (hasCheckedSave.current) return;
    hasCheckedSave.current = true;

    (async () => {
      try {
        const savedState = await gameApi.loadGame();
        if (savedState && savedState.gamePhase && savedState.gamePhase !== 'waiting') {
          // Active shift found — resume it
          applyBackendState(savedState);
          showScreen(SCREENS.GAME);
        }
      } catch {
        // No saved game or not authenticated yet — start normally
      }
    })();
  }, [applyBackendState, showScreen]);

  const startGame = useCallback(() => {
    showScreen(SCREENS.BRIEFING);
  }, [showScreen]);

  const startShift = useCallback(async () => {
    setIsLoading(true);
    try {
      const backendState = await gameApi.startShift();
      applyBackendState(backendState);
      showScreen(SCREENS.GAME);
      // Request first passenger after a short delay
      setTimeout(() => showRideRequest(), 2000 + Math.random() * 3000);
    } catch (err) {
      console.error('Failed to start shift:', err);
    } finally {
      setIsLoading(false);
    }
  }, [applyBackendState, showScreen]);

  const resetGame = useCallback(() => {
    setLocalGameState(getInitialGameState());
  }, []);

  const saveGame = useCallback(async () => {
    try {
      await gameApi.saveGame(gameState);
      setLocalGameState(prev => ({ ...prev, showSaveNotification: true }));
      setTimeout(() => {
        setLocalGameState(prev => ({ ...prev, showSaveNotification: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to save game:', err);
    }
  }, [gameState]);

  const loadGame = useCallback(async () => {
    setIsLoading(true);
    try {
      const savedState = await gameApi.loadGame();
      if (savedState) {
        applyBackendState(savedState);
        showScreen(SCREENS.GAME);
      }
    } catch (err) {
      console.error('Failed to load game:', err);
    } finally {
      setIsLoading(false);
    }
  }, [applyBackendState, showScreen]);

  const deleteSavedGame = useCallback(() => {
    // No-op — handled by backend on end shift
  }, []);

  const showRideRequest = useCallback(async () => {
    const currentGameState = gameStateRef.current;

    // Don't show new ride request if in active phases (but allow if transitioning from dropOff)
    if (
      currentGameState.currentPassenger &&
      currentGameState.gamePhase !== GAME_PHASES.DROP_OFF &&
      currentGameState.gamePhase !== GAME_PHASES.WAITING
    ) {
      return;
    }

    setIsLoading(true);
    try {
      // Backend handles all passenger selection, weather updates, and rule generation
      const backendState = await gameApi.requestPassenger();
      applyBackendState(backendState);
    } catch (err) {
      console.error('Failed to request passenger:', err);
    } finally {
      setIsLoading(false);
    }
  }, [applyBackendState]);

  const gameOver = useCallback((reason: string) => {
    setLocalGameState(prev => ({
      ...prev,
      rulesViolated: prev.rulesViolated + 1,
      gameOverReason: reason,
    }));
    showScreen(SCREENS.GAME_OVER);
  }, [showScreen]);

  const endShift = useCallback(async (successful: boolean, overrideReason?: string): Promise<ShiftData> => {
    try {
      const result = await gameApi.endShift();

      if (result.survived) {
        setLocalGameState(prev => ({
          ...prev,
          earnings: result.earnings,
          survivalBonus: 50,
        }));
        showScreen(SCREENS.SUCCESS);
      } else {
        const reason = overrideReason || 'The night shift has ended in failure...';
        gameOver(reason);
      }

      return {
        earnings: result.earnings,
        ridesCompleted: result.ridesCompleted,
        timeSpent: result.timeSpent,
        survived: result.survived,
        rulesViolated: result.rulesViolated,
        passengersEncountered: result.ridesCompleted,
        difficultyLevel: result.difficultyLevel,
        score: result.score,
      };
    } catch (err) {
      console.error('Failed to end shift:', err);
      // Return fallback data from local state
      return {
        earnings: gameState.earnings,
        ridesCompleted: gameState.ridesCompleted,
        timeSpent: 0,
        survived: successful,
        rulesViolated: gameState.rulesViolated || 0,
        passengersEncountered: gameState.usedPassengers?.length || 0,
        difficultyLevel: gameState.difficultyLevel || 0,
        score: 0,
      };
    }
  }, [gameState, showScreen, gameOver]);

  const updateGameState = useCallback((updater: SetStateAction<GameState>) => {
    setLocalGameState(prev => {
      const fullPrev: GameState = { ...prev, currentScreen } as GameState;
      const result = typeof updater === 'function' ? updater(fullPrev) : updater;
      const { currentScreen: ignoredCurrentScreen, ...rest } = result;
      void ignoredCurrentScreen;
      return rest;
    });
  }, [currentScreen]);

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
    isLoading,
  };
};
