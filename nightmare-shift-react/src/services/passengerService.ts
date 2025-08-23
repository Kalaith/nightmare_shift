import { gameData } from '../data/gameData';
import { RARITY_WEIGHTS, GAME_CONSTANTS } from '../data/constants';
import { GAME_BALANCE } from '../constants/gameBalance';
import { BackstoryService } from './storageService';
import { ErrorHandling, ServiceError, type GameResult } from '../utils/errorHandling';
import type { Passenger, CompletedRide } from '../types/game';

export class PassengerService {
  static selectRandomPassenger(usedPassengers: number[] = [], difficultyLevel: number = 0): GameResult<Passenger> {
    return ErrorHandling.wrap(
      () => {
        const availablePassengers = gameData.passengers.filter(
          passenger => !usedPassengers.includes(passenger.id)
        );
        
        if (availablePassengers.length === 0) {
          const fallbackPassenger = this.selectFromAllUnsafe(difficultyLevel);
          if (!fallbackPassenger) {
            throw ErrorHandling.serviceError('PassengerService', 'selectRandomPassenger', 'No passengers available');
          }
          return fallbackPassenger;
        }
        
        const selectedPassenger = this.selectByRarityUnsafe(availablePassengers, difficultyLevel);
        if (!selectedPassenger) {
          throw ErrorHandling.serviceError('PassengerService', 'selectRandomPassenger', 'Failed to select passenger by rarity');
        }
        
        return selectedPassenger;
      },
      'passenger_selection_failed',
      gameData.passengers[0] // Emergency fallback to first passenger
    );
  }

  // Compatibility wrapper used by older call sites / hooks.
  // Accepts an explicit passenger list and delegates to existing selection logic.
  static getRandomPassenger(passengers: Passenger[], usedPassengers: number[] = [], difficultyLevel: number = 0): Passenger | null {
    // If the callers pass a passenger list, prefer selecting from that list
    // while still respecting usedPassengers and difficulty.
    const available = passengers.filter(p => !usedPassengers.includes(p.id));
    if (available.length === 0) {
      // fall back to selecting from all known passengers using difficulty
      return this.selectFromAllUnsafe(difficultyLevel);
    }

    return this.selectByRarityUnsafe(available, difficultyLevel);
  }

  // UNSAFE: Internal method that can return null - use selectRandomPassenger() for safe calls
  static selectByRarityUnsafe(passengers: Passenger[], difficultyLevel: number = 0): Passenger | null {
    const adjustedWeights = this.getAdjustedRarityWeights(difficultyLevel);
    
    const weightedPool: Passenger[] = [];
    passengers.forEach(passenger => {
      const weight = adjustedWeights[passenger.rarity] || 1;
      for (let i = 0; i < weight; i++) {
        weightedPool.push(passenger);
      }
    });
    
    if (weightedPool.length === 0) return passengers[0] || null;
    
    const randomIndex = Math.floor(Math.random() * weightedPool.length);
    return weightedPool[randomIndex];
  }

  // UNSAFE: Internal method that can return null - use selectRandomPassenger() for safe calls
  static selectFromAllUnsafe(difficultyLevel: number): Passenger | null {
    return this.selectByRarityUnsafe(gameData.passengers, difficultyLevel);
  }

  static getAdjustedRarityWeights(difficultyLevel: number): Record<string, number> {
    const baseWeights = { ...RARITY_WEIGHTS };
    
    switch (difficultyLevel) {
      case 0:
      case 1:
        return baseWeights;
      case 2:
        return { ...baseWeights, rare: baseWeights.rare * 1.5, legendary: baseWeights.legendary * 2 };
      case 3:
        return { ...baseWeights, rare: baseWeights.rare * 2, legendary: baseWeights.legendary * 3 };
      case 4:
      default:
        return { ...baseWeights, rare: baseWeights.rare * 3, legendary: baseWeights.legendary * 5 };
    }
  }

  static shouldSpawnRelatedPassenger(completedRides: CompletedRide[]): GameResult<Passenger | null> {
    return ErrorHandling.wrap(
      () => {
        if (Math.random() > GAME_BALANCE.PROBABILITIES.RELATED_PASSENGER_SPAWN) return null;
        
        if (!completedRides || completedRides.length === 0) return null;
        
        for (const ride of completedRides) {
          const passenger = ride.passenger;
          if (passenger.relatedPassengers) {
            for (const relatedId of passenger.relatedPassengers) {
              const relatedPassenger = gameData.passengers.find(p => p.id === relatedId);
              if (relatedPassenger && Math.random() < GAME_BALANCE.PROBABILITIES.RELATED_PASSENGER_SELECTION) {
                return relatedPassenger;
              }
            }
          }
        }
        
        return null;
      },
      'related_passenger_spawn_failed',
      null // null is a valid result here - means no related passenger spawned
    );
  }

  static checkBackstoryUnlock(passenger: Passenger, isFirstEncounter: boolean): boolean {
    if (BackstoryService.isBackstoryUnlocked(passenger.id)) {
      return true;
    }
    
    const chance = isFirstEncounter ? GAME_CONSTANTS.BACKSTORY_UNLOCK_FIRST : GAME_CONSTANTS.BACKSTORY_UNLOCK_REPEAT;
    
    if (Math.random() < chance) {
      BackstoryService.unlockBackstory(passenger.id);
      return true;
    }
    
    return false;
  }

  // Return a numeric chance [0..1] that a passenger backstory should unlock.
  // This mirrors the backstory unlock logic but exposes the probability instead
  // so callers can use it for UI decisions without mutating state.
  static calculateBackstoryChance(passengerId: number, passengerBackstories: Record<number, boolean> = {}): number {
    // If already unlocked, chance is 1
    if (passengerBackstories[passengerId]) return 1;

    // Heuristic: first encounter higher base chance, repeat encounters lower.
    // This uses the same constants used in checkBackstoryUnlock.
    // We don't know whether it's a first encounter here, so assume first (higher) chance
    const firstChance = GAME_CONSTANTS.BACKSTORY_UNLOCK_FIRST || 0.5;
    const repeatChance = GAME_CONSTANTS.BACKSTORY_UNLOCK_REPEAT || 0.15;

    return Math.max(repeatChance, Math.min(1, (firstChance + repeatChance) / 2));
  }
}