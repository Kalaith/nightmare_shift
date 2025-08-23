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
    if (gameState.fuel < 20) {
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

    setGameState(prev => ({ 
      ...prev, 
      earnings: prev.earnings + Math.max(earnedFare, 5),
      ridesCompleted: prev.ridesCompleted + 1,
      gamePhase: GAME_PHASES.WAITING,
      currentPassenger: null,
      currentDialogue: null
    }));

    // Add items to inventory using new ItemService
    if (passenger.items && Math.random() < GAME_BALANCE.PROBABILITIES.ITEM_DROP) {
      const randomItem = passenger.items[Math.floor(Math.random() * passenger.items.length)];
      const newItemResult = ItemService.createInventoryItem(randomItem, passenger.name, false);
      
      if (newItemResult.success) {
        setGameState(prev => ({ 
          ...prev, 
          inventory: [...prev.inventory, newItemResult.data]
        }));
      }
    }

    // Check for backstory unlock
    const backstoryChance = PassengerService.calculateBackstoryChance(passenger.id, gameState.passengerBackstories || {});
    if (Math.random() < backstoryChance) {
      setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          showBackstoryNotification: {
            passenger: passenger.name,
            backstory: passenger.backstoryDetails!
          }
        }));
      }, 1500);
    }

    setTimeout(() => {
      if (gameState.timeRemaining <= 60 || gameState.fuel <= 15) {
        endShift(true);
      } else {
        setTimeout(() => {
          showRideRequest();
        }, 3000 + Math.random() * 4000);
      }
    }, 1000);
  }, [gameState, setGameState, endShift, showRideRequest]);

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
          const updatedItem = ItemService.useProtectiveItem(item);
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

  return {
    acceptRide,
    declineRide,
    handleDrivingChoice,
    continueToDestination,
    useItem,
    tradeItem,
    processItemEffects
  };
};