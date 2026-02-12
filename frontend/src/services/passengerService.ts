import { gameData } from '../data/gameData';
import { RARITY_WEIGHTS, GAME_CONSTANTS } from '../data/constants';
import { GAME_BALANCE } from '../constants/gameBalance';
import { BackstoryService } from './storageService';
import { ErrorHandling, type GameResult } from '../utils/errorHandling';
import type { Passenger, CompletedRide, Season, WeatherCondition, TimeOfDay } from '../types/game';

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

  static shouldSpawnRelatedPassenger(_completedRides: CompletedRide[]): GameResult<Passenger | null> {
    return ErrorHandling.wrap(
      () => {
        if (Math.random() > GAME_BALANCE.PROBABILITIES.RELATED_PASSENGER_SPAWN) return null;
        
        // TODO: Related passengers feature not yet implemented
        // Requires relatedPassengers property to be added to Passenger type and data
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

  /**
   * Select passenger considering weather and seasonal conditions
   */
  static selectWeatherAwarePassenger(
    usedPassengers: number[] = [],
    difficultyLevel: number = 0,
    weather: WeatherCondition,
    timeOfDay: TimeOfDay,
    season: Season
  ): GameResult<Passenger> {
    return ErrorHandling.wrap(
      () => {
        const availablePassengers = gameData.passengers.filter(
          passenger => !usedPassengers.includes(passenger.id)
        );

        if (availablePassengers.length === 0) {
          const fallbackResult = this.selectRandomPassenger(usedPassengers, difficultyLevel);
          return fallbackResult.success ? fallbackResult.data : gameData.passengers[0];
        }

        // Apply weather, time, and seasonal modifiers to passenger weights
        const weightedPassengers = this.applyEnvironmentalWeights(
          availablePassengers, 
          weather, 
          timeOfDay, 
          season,
          difficultyLevel
        );

        return this.selectFromWeightedPool(weightedPassengers);
      },
      'weather_aware_passenger_selection_failed',
      gameData.passengers[0] // Simple fallback to first passenger
    );
  }

  /**
   * Apply environmental modifiers to passenger spawn weights
   */
  private static applyEnvironmentalWeights(
    passengers: Passenger[],
    weather: WeatherCondition,
    timeOfDay: TimeOfDay,
    season: Season,
    difficultyLevel: number
  ): Array<{ passenger: Passenger; weight: number }> {
    return passengers.map(passenger => {
      let weight = this.getBaseRarityWeight(passenger.rarity, difficultyLevel);

      // Weather-based modifiers
      weight *= this.getWeatherModifier(passenger, weather);
      
      // Time-based modifiers
      weight *= this.getTimeModifier(passenger, timeOfDay);
      
      // Seasonal modifiers
      weight *= this.getSeasonalModifier(passenger, season);
      
      // Special passenger behaviors
      weight *= this.getSpecialBehaviorModifier(passenger, weather, timeOfDay, season);

      return { passenger, weight: Math.max(0.1, weight) }; // Minimum weight of 0.1
    });
  }

  /**
   * Get weather-based spawn modifier for a passenger
   */
  private static getWeatherModifier(passenger: Passenger, weather: WeatherCondition): number {
    const passengerId = passenger.id;
    
    // Weather preferences for specific passengers
    const weatherPreferences: Record<number, Partial<Record<WeatherCondition['type'], number>>> = {
      1: { fog: 1.5, rain: 1.3 }, // Mrs. Chen - ghosts like misty conditions
      3: { thunderstorm: 1.4, rain: 1.2 }, // Sarah Woods - escaped during storms
      4: { fog: 1.3, thunderstorm: 1.2 }, // Dr. Hollow - mysterious conditions
      5: { clear: 0.8, thunderstorm: 1.5 }, // The Collector - dramatic weather
      7: { clear: 1.2, rain: 0.9 }, // Elena Vasquez - prefers clear nights for dancing
      10: { rain: 1.4, fog: 1.3 }, // Old Pete - water-related weather
      11: { thunderstorm: 1.6, fog: 1.4 }, // Madame Zelda - supernatural weather
      12: { rain: 1.2, clear: 1.1 }, // Frank the Pianist - melancholy weather
      13: { thunderstorm: 1.3, snow: 1.2 }, // Sister Agnes - active in dangerous weather
      15: { thunderstorm: 1.8, fog: 1.5 }, // The Midnight Mayor - dramatic weather
      16: { thunderstorm: 2.0, fog: 1.7 } // Death's Taxi Driver - ominous conditions
    };

    const preference = weatherPreferences[passengerId]?.[weather.type] || 1.0;
    
    // Intensity modifiers
    let intensityModifier = 1.0;
    if (weather.intensity === 'heavy') {
      // Supernatural passengers more likely in heavy weather
      if (passenger.supernatural.includes('supernatural') || 
          passenger.supernatural.includes('ghost') || 
          passenger.supernatural.includes('vampire')) {
        intensityModifier = 1.3;
      }
    }

    return preference * intensityModifier;
  }

  /**
   * Get time-based spawn modifier for a passenger
   */
  private static getTimeModifier(passenger: Passenger, timeOfDay: TimeOfDay): number {
    const passengerId = passenger.id;
    
    // Time preferences for specific passengers
    const timePreferences: Record<number, Partial<Record<TimeOfDay['phase'], number>>> = {
      1: { night: 1.4, latenight: 1.6 }, // Mrs. Chen - ghost most active at night
      2: { night: 1.3, latenight: 1.2 }, // Jake Morrison - night shift worker
      4: { night: 1.5, latenight: 1.3 }, // Dr. Hollow - mysterious nighttime visits
      5: { dusk: 1.2, night: 1.4 }, // The Collector - evening deals
      6: { latenight: 0.7 }, // Tommy Sullivan - child, less likely very late
      7: { dusk: 1.3, night: 1.2 }, // Elena Vasquez - evening performance times
      11: { night: 1.5, latenight: 1.6 }, // Madame Zelda - fortune telling at night
      15: { night: 1.8, latenight: 2.0 }, // The Midnight Mayor - rules the night
      16: { latenight: 2.5 } // Death's Taxi Driver - witching hour
    };

    const preference = timePreferences[passengerId]?.[timeOfDay.phase] || 1.0;
    
    // General supernatural activity modifier
    const supernaturalModifier = timeOfDay.supernaturalActivity / 100;
    if (passenger.supernatural !== 'Living' && passenger.supernatural !== 'Human') {
      return preference * (0.7 + supernaturalModifier * 0.6); // 0.7 to 1.3 multiplier
    }

    return preference;
  }

  /**
   * Get seasonal spawn modifier for a passenger
   */
  private static getSeasonalModifier(passenger: Passenger, season: Season): number {
    // Apply seasonal passenger modifiers from the season data
    const seasonalModifiers = season.passengerModifiers.spawnRates;
    
    // Map passenger types to seasonal categories
    const passengerTypes: Record<number, string[]> = {
      1: ['melancholy_souls'], // Mrs. Chen
      3: ['nature_spirits'], // Sarah Woods
      4: ['frost_wraiths'], // Dr. Hollow
      5: ['harvest_spirits'], // The Collector
      6: ['holiday_spirits'], // Tommy Sullivan
      7: ['night_wanderers'], // Elena Vasquez
      8: ['nature_spirits'], // Marcus Thompson
      10: ['nature_spirits'], // Old Pete
      11: ['harvest_spirits'], // Madame Zelda
      12: ['melancholy_souls'], // Frank the Pianist
      13: ['holiday_spirits'], // Sister Agnes
      15: ['frost_wraiths'], // The Midnight Mayor
      16: ['frost_wraiths'] // Death's Taxi Driver
    };

    const passengerCategories = passengerTypes[passenger.id] || [];
    let modifier = 1.0;

    // Apply the highest applicable seasonal modifier
    for (const category of passengerCategories) {
      const categoryModifier = seasonalModifiers[category];
      if (categoryModifier && categoryModifier > modifier) {
        modifier = categoryModifier;
      }
    }

    return modifier;
  }

  /**
   * Get special behavior modifiers based on combined environmental factors
   */
  private static getSpecialBehaviorModifier(
    passenger: Passenger,
    weather: WeatherCondition,
    timeOfDay: TimeOfDay,
    season: Season
  ): number {
    let modifier = 1.0;

    // Special combinations that increase spawn rates
    if (weather.type === 'thunderstorm' && timeOfDay.phase === 'latenight') {
      // Perfect conditions for supernatural entities
      if (passenger.id === 15 || passenger.id === 16 || passenger.id === 11) {
        modifier *= 2.0;
      }
    }

    if (weather.type === 'fog' && (timeOfDay.phase === 'night' || timeOfDay.phase === 'latenight')) {
      // Mysterious fog conditions
      if (passenger.id === 1 || passenger.id === 4) {
        modifier *= 1.5;
      }
    }

    if (season.type === 'winter' && weather.type === 'snow') {
      // Winter supernatural activity
      if (passenger.id === 6 || passenger.id === 13) {
        modifier *= 1.4;
      }
    }

    return modifier;
  }

  /**
   * Get base rarity weight adjusted for difficulty
   */
  private static getBaseRarityWeight(rarity: Passenger['rarity'], difficultyLevel: number): number {
    const adjustedWeights = this.getAdjustedRarityWeights(difficultyLevel);
    return adjustedWeights[rarity] || 1;
  }

  /**
   * Select passenger from weighted pool
   */
  private static selectFromWeightedPool(
    weightedPassengers: Array<{ passenger: Passenger; weight: number }>
  ): Passenger {
    const totalWeight = weightedPassengers.reduce((sum, item) => sum + item.weight, 0);
    
    if (totalWeight === 0) {
      return weightedPassengers[0].passenger;
    }

    let random = Math.random() * totalWeight;
    
    for (const item of weightedPassengers) {
      random -= item.weight;
      if (random <= 0) {
        return item.passenger;
      }
    }

    // Fallback to last passenger
    return weightedPassengers[weightedPassengers.length - 1].passenger;
  }
}
