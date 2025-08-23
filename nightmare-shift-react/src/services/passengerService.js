import { gameData } from '../data/gameData.js';
import { RARITY_WEIGHTS, GAME_CONSTANTS } from '../data/constants.js';
import { BackstoryService } from './storageService.js';

// Passenger Service - handles passenger selection and relationship logic
export class PassengerService {
  // Select a weighted random passenger based on rarity
  static selectRandomPassenger(usedPassengers = [], difficultyLevel = 0) {
    // Filter out already used passengers for this shift
    const availablePassengers = gameData.passengers.filter(
      passenger => !usedPassengers.includes(passenger.id)
    );
    
    if (availablePassengers.length === 0) {
      // If all passengers have been used, allow reuse but with lower chance
      return this.selectFromAll(difficultyLevel);
    }
    
    return this.selectByRarity(availablePassengers, difficultyLevel);
  }
  
  // Select passenger weighted by rarity
  static selectByRarity(passengers, difficultyLevel = 0) {
    // Adjust rarity weights based on difficulty level
    const adjustedWeights = this.getAdjustedRarityWeights(difficultyLevel);
    
    // Create weighted pool
    const weightedPool = [];
    passengers.forEach(passenger => {
      const weight = adjustedWeights[passenger.rarity] || 1;
      for (let i = 0; i < weight; i++) {
        weightedPool.push(passenger);
      }
    });
    
    if (weightedPool.length === 0) return passengers[0];
    
    const randomIndex = Math.floor(Math.random() * weightedPool.length);
    return weightedPool[randomIndex];
  }
  
  // Get rarity weights adjusted for difficulty
  static getAdjustedRarityWeights(difficultyLevel) {
    const baseWeights = { ...RARITY_WEIGHTS };
    
    // At higher difficulty, increase chance of rare/legendary passengers
    switch (difficultyLevel) {
      case 0:
      case 1:
        return baseWeights;
      case 2:
        return {
          ...baseWeights,
          common: 60,
          uncommon: 30,
          rare: 8,
          legendary: 2
        };
      case 3:
        return {
          ...baseWeights,
          common: 50,
          uncommon: 35,
          rare: 12,
          legendary: 3
        };
      case 4:
      default:
        return {
          ...baseWeights,
          common: 40,
          uncommon: 35,
          rare: 20,
          legendary: 5
        };
    }
  }
  
  // Select from all passengers (fallback)
  static selectFromAll(difficultyLevel = 0) {
    return this.selectByRarity(gameData.passengers, difficultyLevel);
  }
  
  // Check if passenger should spawn based on relationships
  static shouldSpawnRelatedPassenger(completedRides) {
    if (Math.random() > GAME_CONSTANTS.RELATIONSHIP_SPAWN_CHANCE) {
      return null;
    }
    
    // Look for passengers with relationships to completed rides
    const spawnCandidates = [];
    completedRides.forEach(ride => {
      const passenger = ride.passenger;
      if (passenger.relationships && passenger.relationships.length > 0) {
        passenger.relationships.forEach(relatedId => {
          const relatedPassenger = gameData.passengers.find(p => p.id === relatedId);
          if (relatedPassenger) {
            spawnCandidates.push(relatedPassenger);
          }
        });
      }
    });
    
    if (spawnCandidates.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * spawnCandidates.length);
    return spawnCandidates[randomIndex];
  }
  
  // Check for backstory unlock
  static checkBackstoryUnlock(passenger, isFirstEncounter) {
    const unlockChance = isFirstEncounter 
      ? GAME_CONSTANTS.BACKSTORY_UNLOCK_FIRST 
      : GAME_CONSTANTS.BACKSTORY_UNLOCK_REPEAT;
    
    if (Math.random() <= unlockChance) {
      BackstoryService.unlockBackstory(passenger.id);
      return true;
    }
    
    return false;
  }
  
  // Get passenger dialogue based on ride progress
  static getPassengerDialogue(passenger, ridePhase = 'start') {
    if (!passenger.dialogue || passenger.dialogue.length === 0) {
      return "..."; // Silent passenger
    }
    
    switch (ridePhase) {
      case 'start':
        return passenger.dialogue[0] || "...";
      case 'middle':
        return passenger.dialogue[1] || passenger.dialogue[0] || "...";
      case 'end':
        return passenger.dialogue[passenger.dialogue.length - 1] || "...";
      default:
        const randomIndex = Math.floor(Math.random() * passenger.dialogue.length);
        return passenger.dialogue[randomIndex];
    }
  }
  
  // Generate passenger tip (for items/money)
  static generatePassengerTip(passenger) {
    if (Math.random() < 0.3) { // 30% chance of tip
      if (passenger.items && passenger.items.length > 0) {
        const randomIndex = Math.floor(Math.random() * passenger.items.length);
        return {
          type: 'item',
          value: passenger.items[randomIndex]
        };
      }
      
      // Monetary tip based on fare
      const tipAmount = Math.floor(passenger.fare * (0.1 + Math.random() * 0.2)); // 10-30% of fare
      return {
        type: 'money',
        value: tipAmount
      };
    }
    
    return null;
  }
  
  // Check if passenger is supernatural
  static isSupernaturalPassenger(passenger) {
    return passenger.supernatural && passenger.supernatural !== "Living person";
  }
  
  // Get passenger rarity color for UI
  static getRarityColor(rarity) {
    const colors = {
      common: '#9CA3AF',     // Gray
      uncommon: '#10B981',   // Green  
      rare: '#3B82F6',       // Blue
      legendary: '#F59E0B'   // Amber
    };
    
    return colors[rarity] || colors.common;
  }
  
  // Get passengers by location for spawning
  static getPassengersByLocation(location) {
    return gameData.passengers.filter(passenger => 
      passenger.pickup === location || passenger.destination === location
    );
  }
  
  // Create ride data structure
  static createRideData(passenger, startTime = Date.now()) {
    return {
      passenger,
      startTime,
      pickup: passenger.pickup,
      destination: passenger.destination,
      fare: passenger.fare,
      duration: null, // Will be set when ride completes
      completed: false,
      ruleViolations: [],
      dialogue: [],
      items: passenger.items ? [...passenger.items] : []
    };
  }
  
  // Check if passenger request violates rules
  static checkPassengerRequest(passenger, request, currentRules) {
    const violatedRules = [];
    
    // Check various request types against rules
    if (request.type === 'window_down' && 
        currentRules.some(rule => rule.id === 4)) { // Windows Sealed
      violatedRules.push(currentRules.find(rule => rule.id === 4));
    }
    
    if (request.type === 'route_change' && 
        currentRules.some(rule => rule.id === 5)) { // Route Restriction
      violatedRules.push(currentRules.find(rule => rule.id === 5));
    }
    
    if (request.type === 'music' && 
        currentRules.some(rule => rule.id === 2)) { // Silent Night
      violatedRules.push(currentRules.find(rule => rule.id === 2));
    }
    
    return violatedRules;
  }
}