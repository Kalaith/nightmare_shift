import { useCallback } from 'react';
import { useGameContext } from '../context/GameContext';
import { GAME_PHASES } from '../data/constants';
import { GAME_BALANCE } from '../constants/gameBalance';
import type { PassengerNeedState, RuleEvaluationResult, Passenger } from '../types/game';
import { RouteService } from '../services/reputationService';
import { PassengerService } from '../services/passengerService';
import { PassengerStateMachine } from '../services/passengerStateMachine';
import { RuleEngine } from '../services/ruleEngine';
import { ItemService } from '../services/itemService';
import { gameData } from '../data/gameData';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const useGameActions = () => {
  const {
    gameState,
    updateGameState: setGameState,
    showRideRequest,
    endShift
  } = useGameContext();

  const acceptRide = useCallback(() => {
    if (gameState.fuel < 5) {
      endShift(false, "You ran out of fuel with a passenger in the car. They were not pleased...");
      return;
    }
    startDriving('pickup');
  }, [gameState.fuel, endShift]);

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
      endShift(false, "You don't have enough fuel for this route. Your car sputtered to a stop...");
      return;
    }

    if (gameState.timeRemaining < routeCosts.timeCost) {
      endShift(false, "This route would take too long. Time ran out before you could reach your destination...");
      return;
    }

    // Check for consecutive route violations (shortcut spam)
    const consecutiveStreak = gameState.consecutiveRouteStreak;
    if (consecutiveStreak && consecutiveStreak.type === routeChoice) {
      const streakCount = consecutiveStreak.count + 1; // +1 because we're about to take this route again

      // Warn at threshold
      if (streakCount === GAME_BALANCE.CONSECUTIVE_ROUTE.WARNING_THRESHOLD) {
        // Show warning but allow (could add UI notification here)
        console.warn(`Warning: ${streakCount} consecutive ${routeChoice} routes taken`);
      }

      // Game over at violation threshold for shortcuts
      if (routeChoice === 'shortcut' && streakCount >= GAME_BALANCE.CONSECUTIVE_ROUTE.VIOLATION_THRESHOLD) {
        endShift(false, `You've taken too many shortcuts. The supernatural entities have noticed your pattern and are waiting for you...`);
        return;
      }
    }

    // Check rule violations
    let ruleOutcome: RuleEvaluationResult | null = null;
    if (routeChoice === 'shortcut') {
      ruleOutcome = RuleEngine.evaluateAction(
        'take_shortcut',
        gameState.currentRules,
        gameState.currentPassenger,
        gameState.currentPassengerNeedState || null,
        gameState.ruleConfidence
      );

      if (ruleOutcome?.violation) {
        endShift(false, ruleOutcome.message || "You deviated from the GPS route. Your passenger noticed... and they were not forgiving.");
        return;
      }
    }

    const needResult = PassengerStateMachine.applyRouteChoice(
      gameState.currentPassengerNeedState || null,
      gameState.currentPassenger || null,
      routeChoice,
      ruleOutcome
    );

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
      pendingRouteDialogue: routeDialogue,
      ruleConfidence: clamp((prev.ruleConfidence ?? 0.5) + (ruleOutcome?.confidenceDelta ?? 0), 0, 1),
      currentPassengerNeedState: needResult.state ?? prev.currentPassengerNeedState ?? null,
      detectedTells: PassengerStateMachine.mergeDetectedTells(
        prev.detectedTells || [],
        needResult.triggeredTells,
        prev.currentPassenger?.id || gameState.currentPassenger?.id || 0
      )
    }));

    // Handle supernatural encounters based on risk level
    if (routeCosts.riskLevel > GAME_BALANCE.RISK_LEVELS.SUPERNATURAL_THRESHOLD &&
      Math.random() < GAME_BALANCE.PROBABILITIES.HIGH_RISK_ENCOUNTER) {
      // High risk route taken, supernatural encounter possible
    }

    if (phase === 'pickup') {
      startPassengerInteraction(needResult.state ?? gameState.currentPassengerNeedState ?? null);
    } else {
      completeRide();
    }
  }, [gameState, setGameState, endShift]);

  const startPassengerInteraction = useCallback((nextNeedState?: PassengerNeedState | null) => {
    const passenger = gameState.currentPassenger;
    if (!passenger) return;

    // Use route dialogue if available, otherwise use random dialogue
    const dialogue = gameState.pendingRouteDialogue ||
      passenger.dialogue[Math.floor(Math.random() * passenger.dialogue.length)];

    setGameState(prev => ({
      ...prev,
      gamePhase: GAME_PHASES.INTERACTION,
      currentDialogue: {
        text: dialogue,
        speaker: 'passenger',
        timestamp: Date.now(),
        type: 'normal'
      },
      pendingRouteDialogue: null // Clear after use
    }));
  }, [gameState.currentPassenger, gameState.currentPassengerNeedState, gameState.pendingRouteDialogue, setGameState]);

  const continueToDestination = useCallback(() => {
    startDriving('destination');
  }, [startDriving]);

  const completeRide = useCallback(() => {
    const passenger = gameState.currentPassenger;
    if (!passenger) return;

    // Get the route choice from recent history
    const recentRoute = gameState.routeHistory?.[gameState.routeHistory.length - 1];
    const routeChoice = recentRoute?.choice;

    // Calculate route-based fare multiplier
    let routeFareMultiplier = 1.0;
    switch (routeChoice) {
      case 'shortcut':
        routeFareMultiplier = GAME_BALANCE.ROUTE_FARE_MULTIPLIERS.SHORTCUT;
        break;
      case 'normal':
        routeFareMultiplier = GAME_BALANCE.ROUTE_FARE_MULTIPLIERS.NORMAL;
        break;
      case 'scenic':
        routeFareMultiplier = GAME_BALANCE.ROUTE_FARE_MULTIPLIERS.SCENIC;
        break;
      case 'police':
        routeFareMultiplier = GAME_BALANCE.ROUTE_FARE_MULTIPLIERS.POLICE;
        break;
    }

    // Apply consecutive route penalty
    const consecutiveStreak = gameState.consecutiveRouteStreak;
    let consecutivePenalty = 0;
    if (consecutiveStreak && consecutiveStreak.count >= 2) {
      // -10% per consecutive same route after the first
      consecutivePenalty = (consecutiveStreak.count - 1) * GAME_BALANCE.CONSECUTIVE_ROUTE.PENALTY_PER_REPEAT;
      routeFareMultiplier *= (1 - consecutivePenalty);
    }

    // Find passenger's preference for the chosen route
    const passengerPreference = passenger.routePreferences?.find(
      pref => pref.route === routeChoice
    );

    // Apply passenger preference modifier (stacks with route multiplier)
    const passengerFareModifier = passengerPreference?.fareModifier || 1.0;

    // Calculate final fare: base fare × route multiplier × passenger preference
    const baseFare = passenger.fare;
    const modifiedFare = Math.floor(baseFare * routeFareMultiplier * passengerFareModifier);

    // Add small random variation (±$5)
    const earnedFare = Math.floor(modifiedFare + (Math.random() * 10) - 5);
    const actualEarnings = Math.max(earnedFare, 5); // Minimum $5

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
      currentDialogue: undefined
    }));

    // Add backstory to unlocked collection if applicable
    if (backstoryUnlocked) {
      setGameState(prev => ({
        ...prev,
        passengerBackstories: {
          ...prev.passengerBackstories,
          [passenger.id]: true
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
    setGameState(prev => {
      return {
        ...prev,
        gamePhase: GAME_PHASES.WAITING,
        currentPassenger: null,
        lastRideCompletion: undefined
      };
    });

    // Schedule next ride request based on current state
    setTimeout(() => {
      // Check current game state values to decide whether to continue or end
      if (gameState.timeRemaining <= 60 || gameState.fuel <= 5) {
        endShift(true);
      } else {
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