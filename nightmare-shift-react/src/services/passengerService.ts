import { gameData } from '../data/gameData';
import { RARITY_WEIGHTS, GAME_CONSTANTS } from '../data/constants';
import { BackstoryService } from './storageService';
import type { Passenger, CompletedRide } from '../types/game';

export class PassengerService {
  static selectRandomPassenger(usedPassengers: number[] = [], difficultyLevel: number = 0): Passenger | null {
    const availablePassengers = gameData.passengers.filter(
      passenger => !usedPassengers.includes(passenger.id)
    );
    
    if (availablePassengers.length === 0) {
      return this.selectFromAll(difficultyLevel);
    }
    
    return this.selectByRarity(availablePassengers, difficultyLevel);
  }

  static selectByRarity(passengers: Passenger[], difficultyLevel: number = 0): Passenger | null {
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

  static selectFromAll(difficultyLevel: number): Passenger | null {
    return this.selectByRarity(gameData.passengers, difficultyLevel);
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

  static shouldSpawnRelatedPassenger(completedRides: CompletedRide[]): Passenger | null {
    if (Math.random() > 0.3) return null; // 30% chance
    
    for (const ride of completedRides) {
      const passenger = ride.passenger;
      if (passenger.relatedPassengers) {
        for (const relatedId of passenger.relatedPassengers) {
          const relatedPassenger = gameData.passengers.find(p => p.id === relatedId);
          if (relatedPassenger && Math.random() < 0.5) {
            return relatedPassenger;
          }
        }
      }
    }
    
    return null;
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
}