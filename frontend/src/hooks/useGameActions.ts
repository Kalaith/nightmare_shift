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
    // Reset to waiting state after declining
    setGameState(prev => ({
      ...prev,
      gamePhase: GAME_PHASES.WAITING,
      currentPassenger: null
    }));
    
    setTimeout(() => {
      showRideRequest();
    }, 2000 + Math.random() * 3000);
  }, [showRideRequest, setGameState]);

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
    
    const routeCosts = RouteService.calculateRouteCosts(
      routeChoice, 
      passengerRiskLevel, 
      gameState.currentWeather,
      gameState.timeOfDay,
      gameState.environmentalHazards,
      gameState.routeMastery,
      gameState.currentPassenger || undefined
    );
    
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

    // Get passenger preference and calculate dialogue trigger
    const passengerPreference = gameState.currentPassenger?.routePreferences?.find(
      pref => pref.route === routeChoice
    );
    
    let routeDialogue: string | null = null;
    if (passengerPreference && Math.random() < (passengerPreference.triggerChance || 0.5)) {
      routeDialogue = passengerPreference.specialDialogue || null;
    }

    // Apply route effects - no more flat bonuses, use passenger multipliers
    let bonusEarnings = 0;

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
      routeHistory: [...prev.routeHistory, routeHistoryEntry],
      // Update route mastery
      routeMastery: {
        ...prev.routeMastery,
        [routeChoice]: (prev.routeMastery?.[routeChoice] || 0) + 1
      },
      // Track route streaks for consequences
      consecutiveRouteStreak: prev.consecutiveRouteStreak?.type === routeChoice 
        ? { type: routeChoice, count: prev.consecutiveRouteStreak.count + 1 }
        : { type: routeChoice, count: 1 },
      // Store route dialogue for interaction phase
      pendingRouteDialogue: routeDialogue
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

    // Use route dialogue if available, otherwise use random dialogue
    const dialogue = gameState.pendingRouteDialogue || 
      passenger.dialogue[Math.floor(Math.random() * passenger.dialogue.length)];

    setGameState(prev => ({ 
      ...prev, 
      gamePhase: GAME_PHASES.INTERACTION,
      currentDialogue: dialogue,
      pendingRouteDialogue: null // Clear after use
    }));
  }, [gameState.currentPassenger, gameState.pendingRouteDialogue, setGameState]);

  const continueToDestination = useCallback(() => {
    startDriving('destination');
  }, [startDriving]);

  const completeRide = useCallback(() => {
    const passenger = gameState.currentPassenger;
    if (!passenger) return;

    // Get the route choice from recent history
    const recentRoute = gameState.routeHistory?.[gameState.routeHistory.length - 1];
    const routeChoice = recentRoute?.choice;
    
    // Find passenger's preference for the chosen route
    const passengerPreference = passenger.routePreferences?.find(
      pref => pref.route === routeChoice
    );
    
    // Apply fare modifier based on passenger preference
    const fareModifier = passengerPreference?.fareModifier || 1.0;
    const baseFare = passenger.fare;
    const modifiedFare = Math.floor(baseFare * fareModifier);
    const earnedFare = Math.floor(modifiedFare + (Math.random() * 10) - 5);
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
    console.log('continueFromDropOff called - current state:', {
      currentPassenger: gameState.currentPassenger?.name,
      gamePhase: gameState.gamePhase
    });
    
    // Clear the completed ride data and return to waiting phase
    setGameState(prev => {
      console.log('continueFromDropOff setState - clearing passenger and setting to waiting');
      return {
        ...prev,
        gamePhase: GAME_PHASES.WAITING,
        currentPassenger: null,
        lastRideCompletion: undefined
      };
    });

    // Schedule next ride request based on current state
    setTimeout(() => {
      console.log('continueFromDropOff timeout - checking state for next action:', {
        timeRemaining: gameState.timeRemaining,
        fuel: gameState.fuel
      });
      
      // Check current game state values to decide whether to continue or end
      if (gameState.timeRemaining <= 60 || gameState.fuel <= 5) {
        console.log('Ending shift due to low resources');
        endShift(true);
      } else {
        console.log('Calling showRideRequest from continueFromDropOff timeout');
        showRideRequest();
      }
    }, 2500 + Math.random() * 2500); // Single timeout with random delay
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