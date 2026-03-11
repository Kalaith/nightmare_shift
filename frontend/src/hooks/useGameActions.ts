import { useCallback } from 'react';
import { useGameContext } from './useGameContext';
import { GAME_PHASES } from '../data/constants';
import type { Passenger } from '../types/game';
import { gameApi } from '../api/gameApi';

export const useGameActions = () => {
  const { gameState, updateGameState: setGameState, endShift } = useGameContext();

  const declineRide = useCallback(() => {
    void (async () => {
      try {
        const backendState = await gameApi.declineRide();
        const { currentScreen: _ignored, ...rest } = backendState as typeof backendState & {
          currentScreen?: string;
        };
        void _ignored;
        setGameState(prev => ({ ...prev, ...rest }));
      } catch (err) {
        console.error('Failed to decline ride:', err);
      }
    })();
  }, [setGameState]);

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

  const completeRide = useCallback(async () => {
    const passenger = gameState.currentPassenger;
    if (!passenger) return;

    try {
      const backendState = await gameApi.completeRide(true);
      const { currentScreen: _ignored, ...rest } = backendState as typeof backendState & {
        currentScreen?: string;
      };
      void _ignored;
      setGameState(prev => ({ ...prev, ...rest }));
    } catch (err) {
      console.error('Failed to complete ride:', err);
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

  const handleDrivingChoice = useCallback(
    async (choice: string, phase: string) => {
      try {
        const backendState = await gameApi.drivingChoice(choice, phase);

        if (backendState.gamePhase === 'gameOver') {
          const reason = backendState.gameOverReason || 'Something went wrong during the drive...';
          endShift(false, reason);
          return;
        }

        const { currentScreen: _ignored, ...rest } = backendState as typeof backendState & {
          currentScreen?: string;
        };
        void _ignored;
        setGameState(prev => ({ ...prev, ...rest }));
      } catch (err) {
        console.error('Failed to process driving choice:', err);
      }
    },
    [endShift, setGameState]
  );

  const handleCabAction = useCallback(
    async (action: string) => {
      try {
        const backendState = await gameApi.interaction(action);

        if (backendState.gamePhase === 'gameOver') {
          const reason = backendState.gameOverReason || 'Something went wrong during the ride...';
          endShift(false, reason);
          return;
        }

        if (backendState.gamePhase === 'dropOff') {
          await completeRide();
          return;
        }

        const { currentScreen: _ignored, ...rest } = backendState as typeof backendState & {
          currentScreen?: string;
        };
        void _ignored;
        setGameState(prev => ({ ...prev, ...rest }));
      } catch (err) {
        console.error('Failed to process interaction:', err);
      }
    },
    [completeRide, endShift, setGameState]
  );

  const useItem = useCallback(
    async (itemId: string) => {
      const item = gameState.inventory.find(i => i.id === itemId);
      if (!item || !item.canUse) return;

      try {
        const backendState = await gameApi.interaction(`use_item_${itemId}`);
        const { currentScreen: _ignored, ...rest } = backendState as typeof backendState & {
          currentScreen?: string;
        };
        void _ignored;
        setGameState(prev => ({ ...prev, ...rest }));
      } catch (err) {
        console.error('Failed to use item:', err);
      }
    },
    [gameState.inventory, setGameState]
  );

  const tradeItem = useCallback(
    async (itemId: string, passenger: Passenger) => {
      const item = gameState.inventory.find(i => i.id === itemId);
      if (!item) return;

      try {
        const backendState = await gameApi.interaction(`trade_item_${itemId}_${passenger.id}`);
        const { currentScreen: _ignored, ...rest } = backendState as typeof backendState & {
          currentScreen?: string;
        };
        void _ignored;
        setGameState(prev => ({ ...prev, ...rest }));
      } catch (err) {
        console.error('Failed to trade item:', err);
      }
    },
    [gameState.inventory, setGameState]
  );

  const processItemEffects = useCallback(() => {
    // No-op. Backend applies item effects during actions.
  }, []);

  const refuelFull = useCallback(() => {
    void (async () => {
      try {
        const backendState = await gameApi.refuel('full');
        const { currentScreen: _ignored, ...rest } = backendState as typeof backendState & {
          currentScreen?: string;
        };
        void _ignored;
        setGameState(prev => ({ ...prev, ...rest }));
      } catch (err) {
        console.error('Failed to refuel fully:', err);
      }
    })();
  }, [setGameState]);

  const refuelPartial = useCallback(() => {
    void (async () => {
      try {
        const backendState = await gameApi.refuel('partial');
        const { currentScreen: _ignored, ...rest } = backendState as typeof backendState & {
          currentScreen?: string;
        };
        void _ignored;
        setGameState(prev => ({ ...prev, ...rest }));
      } catch (err) {
        console.error('Failed to refuel partially:', err);
      }
    })();
  }, [setGameState]);

  const continueFromDropOff = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      gamePhase: GAME_PHASES.WAITING,
      currentPassenger: null,
      lastRideCompletion: undefined,
      cabState: { windowsOpen: false, radioOn: false },
      rideProgress: null,
      pendingTipOffer: null,
    }));
  }, [setGameState]);

  return {
    acceptRide,
    declineRide,
    handleDrivingChoice,
    handleCabAction,
    useItem,
    tradeItem,
    processItemEffects,
    refuelFull,
    refuelPartial,
    continueFromDropOff,
  };
};
