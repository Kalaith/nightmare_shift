import { useCallback } from 'react';
import type { GameState, Passenger } from '../types/game';
import { GAME_PHASES } from '../data/constants';
import { GAME_BALANCE } from '../constants/gameBalance';
import { RouteService } from '../services/reputationService';
import { PassengerService } from '../services/passengerService';
import { ItemService } from '../services/itemService';
import { gameData } from '../data/gameData';

interface UseGameActionsProps {
  gameState: GameState;
  setGameState: (value: GameState | ((prev: GameState) => GameState)) => void;
  showRideRequest: () => void;
  gameOver: (reason: string) => void;
  endShift: (successful: boolean) => unknown;
}

export const useGameActions = ({
  gameState,
  setGameState,
  showRideRequest,
  gameOver,
  endShift
}: UseGameActionsProps) => {
  
  const acceptRide = useCallback(() => {
    if (gameState.fuel < 5) {
      gameOver("You ran out of fuel with a passenger in the car. They were not pleased...");
      return;
    }
    startDriving('pickup');
  }, [gameState.fuel, gameOver]);

  const declineRide = useCallback(() => {
    setTimeout(() => {
      showRideRequest();
    }, 2000 + Math.random() * 3000);
  }, [showRideRequest]);

  const startDriving = useCallback((phase: 'pickup' | 'destination') => {
    const location = phase === 'pickup' 
      ? gameData.locations.find(loc => loc.name === gameState.currentPassenger?.pickup)
      : gameData.locations.find(loc => loc.name === gameState.currentPassenger?.destination);

    setGameState(prev => ({
      ...prev,
      gamePhase: GAME_PHASES.DRIVING,
      currentDrivingPhase: phase,
      currentLocation: location
    }));
  }, [gameState.currentPassenger, setGameState]);

  const handleDrivingChoice = useCallback((choice: string, phase: string) => {
    const routeChoice = choice as 'normal' | 'shortcut' | 'scenic' | 'police';
    const passengerRiskLevel = gameState.currentPassenger ? 
      gameData.locations.find(loc => loc.name === gameState.currentPassenger?.pickup)?.riskLevel || 1 : 1;
    
    const routeCosts = RouteService.calculateRouteCosts(routeChoice, passengerRiskLevel);
    
    // Check if player has enough resources
    if (gameState.fuel < routeCosts.fuelCost) {
      gameOver("You don't have enough fuel for this route. Your car sputtered to a stop...");
      return;
    }
    
    if (gameState.timeRemaining < routeCosts.timeCost) {
      gameOver("This route would take too long. Time ran out before you could reach your destination...");
      return;
    }

    // Check rule violations
    if (routeChoice === 'shortcut') {
      const routeRestriction = gameState.currentRules.find(rule => rule.id === 5);
      if (routeRestriction) {
        gameOver("You deviated from the GPS route. Your passenger noticed... and they were not forgiving.");
        return;
      }
    }

    // Apply route effects
    let bonusEarnings = 0;
    if (routeChoice === 'scenic' && gameState.currentPassenger) {
      bonusEarnings = 10; // Scenic route bonus
    }

    // Record route choice in history
    const routeHistoryEntry = {
      choice: routeChoice,
      phase: phase as 'pickup' | 'destination',
      fuelCost: routeCosts.fuelCost,
      timeCost: routeCosts.timeCost,
      riskLevel: routeCosts.riskLevel,
      passenger: gameState.currentPassenger?.id,
      timestamp: Date.now()
    };

    setGameState(prev => ({ 
      ...prev, 
      fuel: prev.fuel - routeCosts.fuelCost,
      timeRemaining: prev.timeRemaining - routeCosts.timeCost,
      earnings: prev.earnings + bonusEarnings,
      routeHistory: [...prev.routeHistory, routeHistoryEntry]
    }));

    // Handle supernatural encounters based on risk level
    if (routeCosts.riskLevel > GAME_BALANCE.RISK_LEVELS.SUPERNATURAL_THRESHOLD && 
        Math.random() < GAME_BALANCE.PROBABILITIES.HIGH_RISK_ENCOUNTER) {
      console.log(`High risk route taken (${routeCosts.riskLevel}), supernatural encounter possible...`);
    }

    if (phase === 'pickup') {
      startPassengerInteraction();
    } else {
      completeRide();
    }
  }, [gameState, setGameState, gameOver]);

  const startPassengerInteraction = useCallback(() => {
    const passenger = gameState.currentPassenger;
    if (!passenger) return;

    const dialogue = passenger.dialogue[Math.floor(Math.random() * passenger.dialogue.length)];

    setGameState(prev => ({ 
      ...prev, 
      gamePhase: GAME_PHASES.INTERACTION,
      currentDialogue: dialogue
    }));
  }, [gameState.currentPassenger, setGameState]);

  const continueToDestination = useCallback(() => {
    startDriving('destination');
  }, [startDriving]);

  const completeRide = useCallback(() => {
    const passenger = gameState.currentPassenger;
    if (!passenger) return;

    const baseFare = passenger.fare;
    const earnedFare = Math.floor(baseFare + (Math.random() * 10) - 5);
    const actualEarnings = Math.max(earnedFare, 5);
    
    // Collect items that might be received
    const itemsReceived: import('../types/game').InventoryItem[] = [];
    if (passenger.items && Math.random() < GAME_BALANCE.PROBABILITIES.ITEM_DROP) {
      const randomItem = passenger.items[Math.floor(Math.random() * passenger.items.length)];
      const newItemResult = ItemService.createInventoryItem(randomItem, passenger.name, false);
      
      if (newItemResult.success) {
        itemsReceived.push(newItemResult.data);
      }
    }

    // Check for backstory unlock
    let backstoryUnlocked: { passenger: string; backstory: string } | undefined;
    const backstoryChance = PassengerService.calculateBackstoryChance(passenger.id, gameState.passengerBackstories || {});
    if (Math.random() < backstoryChance) {
      backstoryUnlocked = {
        passenger: passenger.name,
        backstory: passenger.backstoryDetails || `${passenger.name} shares a mysterious secret from their past...`
      };
    }

    // Update game state with earnings and completion data
    setGameState(prev => ({ 
      ...prev, 
      earnings: prev.earnings + actualEarnings,
      ridesCompleted: prev.ridesCompleted + 1,
      gamePhase: GAME_PHASES.DROP_OFF,
      inventory: [...prev.inventory, ...itemsReceived],
      lastRideCompletion: {
        passenger,
        fareEarned: actualEarnings,
        itemsReceived,
        backstoryUnlocked
      },
      currentDialogue: null
    }));

    // Add backstory to unlocked collection if applicable
    if (backstoryUnlocked) {
      setGameState(prev => ({
        ...prev,
        passengerBackstories: {
          ...prev.passengerBackstories,
          [passenger.id]: (prev.passengerBackstories?.[passenger.id] || 0) + 1
        }
      }));
    }
  }, [gameState, setGameState]);

  const useItem = useCallback((itemId: string) => {
    const item = gameState.inventory.find(i => i.id === itemId);
    if (!item || !item.canUse) return;

    // Apply item effects
    const newGameStateResult = ItemService.applyItemEffects(gameState, item);
    if (newGameStateResult.success) {
      setGameState(prev => {
        let newState = newGameStateResult.data;
        
        // Update item uses if it has limited uses
        if (item.protectiveProperties?.usesRemaining) {
          const updatedItem = {
            ...item,
            protectiveProperties: {
              ...item.protectiveProperties,
              usesRemaining: item.protectiveProperties.usesRemaining - 1
            }
          };
          newState = {
            ...newState,
            inventory: prev.inventory.map(i => 
              i.id === itemId ? updatedItem : i
            ).filter(i => !i.protectiveProperties || (i.protectiveProperties.usesRemaining && i.protectiveProperties.usesRemaining > 0))
          };
        }
        
        return newState;
      });
    }
  }, [gameState, setGameState]);

  const tradeItem = useCallback((itemId: string, passenger: Passenger) => {
    const item = gameState.inventory.find(i => i.id === itemId);
    if (!item || !ItemService.canTradeWith(item, passenger)) return;

    const tradeOptions = ItemService.getTradeOptions(item, passenger);
    if (tradeOptions.length === 0) return;

    // Execute the first available trade
    const trade = tradeOptions[0];
    
    setGameState(prev => {
      let newInventory = prev.inventory.filter(i => i.id !== itemId);
      
      // Add received item if any
      if (trade.receive) {
        newInventory.push(trade.receive);
      }
      
      // Handle special consequences
      let newState = { ...prev, inventory: newInventory };
      
      if (passenger.id === 11 && !trade.receive) {
        // Madame Zelda reveals hidden rule
        if (prev.hiddenRules && prev.hiddenRules.length > 0) {
          const revealedRule = prev.hiddenRules[0];
          newState = {
            ...newState,
            hiddenRules: prev.hiddenRules.slice(1),
            revealedHiddenRules: [...(prev.revealedHiddenRules || []), revealedRule]
          };
        }
      }
      
      return newState;
    });
  }, [gameState, setGameState]);

  // Process item deterioration and cursed effects periodically
  const processItemEffects = useCallback(() => {
    setGameState(prev => {
      // Apply deterioration
      const deterioratedInventory = ItemService.processItemDeterioration(prev.inventory);
      
      // Apply cursed effects
      const cursedEffectsResult = ItemService.applyCursedEffects({
        ...prev,
        inventory: deterioratedInventory
      });
      
      return cursedEffectsResult.success ? cursedEffectsResult.data : prev;
    });
  }, [setGameState]);

  const refuelFull = useCallback(() => {
    const fuelNeeded = 100 - gameState.fuel;
    const cost = Math.ceil(fuelNeeded * GAME_BALANCE.FUEL_COSTS.PER_PERCENT);
    
    if (gameState.earnings >= cost && gameState.fuel < 100) {
      setGameState(prev => ({
        ...prev,
        fuel: 100,
        earnings: prev.earnings - cost
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
        earnings: prev.earnings - cost
      }));
    }
  }, [gameState.fuel, gameState.earnings, setGameState]);

  const continueFromDropOff = useCallback(() => {
    // Clear the completed ride data and return to waiting phase
    setGameState(prev => ({
      ...prev,
      gamePhase: GAME_PHASES.WAITING,
      currentPassenger: null,
      lastRideCompletion: undefined
    }));

    // Schedule next ride request based on current state
    setTimeout(() => {
      if (gameState.timeRemaining <= 60 || gameState.fuel <= 5) {
        endShift(true);
      } else {
        setTimeout(() => {
          showRideRequest();
        }, 2000 + Math.random() * 3000);
      }
    }, 500);
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
    continueFromDropOff
  };
};