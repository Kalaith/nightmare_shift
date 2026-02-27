import { useCallback } from 'react';
import { useGameContext } from './useGameContext';
import { GAME_PHASES } from '../data/constants';
import { GAME_BALANCE } from '../constants/gameBalance';
import type { Passenger } from '../types/game';
import { gameApi } from '../api/gameApi';

/**
 * Game actions hook — refactored to delegate business logic to the backend.
 *
 * Most actions now call a backend API endpoint which processes the logic
 * and returns the updated game state. The frontend only handles UI state
 * transitions and optimistic updates where needed.
 */
export const useGameActions = () => {
  const { gameState, updateGameState: setGameState, showRideRequest, endShift } = useGameContext();

  const declineRide = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      gamePhase: GAME_PHASES.WAITING,
      currentPassenger: null,
    }));

    setTimeout(
      () => {
        showRideRequest();
      },
      2000 + Math.random() * 3000
    );
  }, [showRideRequest, setGameState]);

  const startDriving = useCallback(
    (phase: 'pickup' | 'destination') => {
      setGameState(prev => ({
        ...prev,
        gamePhase: GAME_PHASES.DRIVING,
        currentDrivingPhase: phase,
      }));
    },
    [setGameState]
  );

  const acceptRide = useCallback(() => {
    if (gameState.fuel < 5) {
      endShift(false, 'You ran out of fuel with a passenger in the car. They were not pleased...');
      return;
    }
    startDriving('pickup');
  }, [gameState.fuel, endShift, startDriving]);

  /**
   * Handle driving choice — delegates route cost calculation, rule checking,
   * and state updates to the backend.
   */
  const handleDrivingChoice = useCallback(
    async (choice: string, phase: string) => {
      try {
        // Backend handles: route costs, rule violations, fuel/time deduction,
        // route mastery, passenger state machine, game over checks
        const backendState = await gameApi.drivingChoice(choice, phase);

        // Check if backend flagged game over
        if (backendState.gamePhase === 'gameOver') {
          const reason =
            backendState.gameOverReason ||
            'Something went wrong during the drive...';
          endShift(false, reason);
          return;
        }

        // Apply backend state
        const { currentScreen: _ignored, ...rest } = backendState as typeof backendState & { currentScreen?: string };
        void _ignored;
        setGameState(prev => ({ ...prev, ...rest }));

        // Handle UI transitions
        if (phase === 'pickup') {
          startPassengerInteraction();
        } else {
          completeRide();
        }
      } catch (err) {
        console.error('Failed to process driving choice:', err);
      }
    },
    [setGameState, endShift]
  );

  const startPassengerInteraction = useCallback(() => {
    const passenger = gameState.currentPassenger;
    if (!passenger) return;

    const dialogue =
      gameState.pendingRouteDialogue ||
      passenger.dialogue[Math.floor(Math.random() * passenger.dialogue.length)];

    setGameState(prev => ({
      ...prev,
      gamePhase: GAME_PHASES.INTERACTION,
      currentDialogue: {
        text: dialogue,
        speaker: 'passenger',
        timestamp: Date.now(),
        type: 'normal',
      },
      pendingRouteDialogue: null,
    }));
  }, [gameState.currentPassenger, gameState.pendingRouteDialogue, setGameState]);

  const continueToDestination = useCallback(() => {
    startDriving('destination');
  }, [startDriving]);

  /**
   * Complete ride — backend handles fare calculation, item drops,
   * backstory unlocks, reputation updates, and almanac tracking.
   */
  const completeRide = useCallback(async () => {
    const passenger = gameState.currentPassenger;
    if (!passenger) return;

    try {
      const backendState = await gameApi.completeRide(true);
      const { currentScreen: _ignored, ...rest } = backendState as typeof backendState & { currentScreen?: string };
      void _ignored;
      setGameState(prev => ({ ...prev, ...rest }));
    } catch (err) {
      console.error('Failed to complete ride:', err);
      // Fallback: simple local completion
      setGameState(prev => ({
        ...prev,
        earnings: prev.earnings + (passenger.fare || 10),
        ridesCompleted: prev.ridesCompleted + 1,
        gamePhase: GAME_PHASES.DROP_OFF,
        currentDialogue: undefined,
        lastRideCompletion: {
          passenger,
          fareEarned: passenger.fare || 10,
          itemsReceived: [],
          backstoryUnlocked: undefined,
        },
      }));
    }
  }, [gameState.currentPassenger, setGameState]);

  /**
   * Use an item — sends interaction to backend for effect processing.
   */
  const useItem = useCallback(
    async (itemId: string) => {
      const item = gameState.inventory.find(i => i.id === itemId);
      if (!item || !item.canUse) return;

      try {
        const backendState = await gameApi.interaction(`use_item_${itemId}`);
        const { currentScreen: _ignored, ...rest } = backendState as typeof backendState & { currentScreen?: string };
        void _ignored;
        setGameState(prev => ({ ...prev, ...rest }));
      } catch (err) {
        console.error('Failed to use item:', err);
      }
    },
    [gameState.inventory, setGameState]
  );

  /**
   * Trade an item with a passenger — sends trade action to backend.
   */
  const tradeItem = useCallback(
    async (itemId: string, passenger: Passenger) => {
      const item = gameState.inventory.find(i => i.id === itemId);
      if (!item) return;

      try {
        const backendState = await gameApi.interaction(`trade_item_${itemId}_${passenger.id}`);
        const { currentScreen: _ignored, ...rest } = backendState as typeof backendState & { currentScreen?: string };
        void _ignored;
        setGameState(prev => ({ ...prev, ...rest }));
      } catch (err) {
        console.error('Failed to trade item:', err);
      }
    },
    [gameState.inventory, setGameState]
  );

  const processItemEffects = useCallback(() => {
    // Item effects are now processed by the backend during each game action
    // This is kept as a no-op for compatibility
  }, []);

  const refuelFull = useCallback(() => {
    const fuelNeeded = 100 - gameState.fuel;
    const cost = Math.ceil(fuelNeeded * GAME_BALANCE.FUEL_COSTS.PER_PERCENT);

    if (gameState.earnings >= cost && gameState.fuel < 100) {
      setGameState(prev => ({
        ...prev,
        fuel: 100,
        earnings: prev.earnings - cost,
      }));
    }
  }, [gameState.fuel, gameState.earnings, setGameState]);

  const refuelPartial = useCallback(() => {
    const fuelToAdd = Math.min(25, 100 - gameState.fuel);
    const cost = Math.ceil(fuelToAdd * GAME_BALANCE.FUEL_COSTS.PER_PERCENT);

    if (gameState.earnings >= cost && gameState.fuel < 75) {
      setGameState(prev => ({
        ...prev,
        fuel: prev.fuel + fuelToAdd,
        earnings: prev.earnings - cost,
      }));
    }
  }, [gameState.fuel, gameState.earnings, setGameState]);

  const continueFromDropOff = useCallback(() => {
    setGameState(prev => {
      return {
        ...prev,
        gamePhase: GAME_PHASES.WAITING,
        currentPassenger: null,
        lastRideCompletion: undefined,
      };
    });

    setTimeout(
      () => {
        if (gameState.timeRemaining <= 60 || gameState.fuel <= 5) {
          endShift(true);
        } else {
          showRideRequest();
        }
      },
      2500 + Math.random() * 2500
    );
  }, [gameState, setGameState, endShift, showRideRequest]);

  return {
    acceptRide,
    declineRide,
    handleDrivingChoice,
    continueToDestination,
    useItem,
    tradeItem,
    processItemEffects,
    refuelFull,
    refuelPartial,
    continueFromDropOff,
  };
};
