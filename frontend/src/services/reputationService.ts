import type {
  PassengerReputation,
  WeatherCondition,
  TimeOfDay,
  EnvironmentalHazard,
  PlayerStats,
} from '../types/game';
import { GAME_CONSTANTS } from '../data/constants';
import { GAME_BALANCE, BalanceHelpers } from '../constants/gameBalance';
import { WeatherService } from './weatherService';
import { ErrorHandling, type GameResult } from '../utils/errorHandling';
import { AlmanacHelper } from '../utils/almanacHelper';

export class ReputationService {
  static initializeReputation(): Record<number, PassengerReputation> {
    return {};
  }

  static getPassengerReputation(
    passengerReputation: Record<number, PassengerReputation>,
    passengerId: number
  ): PassengerReputation {
    if (!passengerReputation[passengerId]) {
      passengerReputation[passengerId] = {
        interactions: 0,
        positiveChoices: 0,
        negativeChoices: 0,
        lastEncounter: 0,
        relationshipLevel: 'neutral',
        specialUnlocks: [],
      };
    }
    return passengerReputation[passengerId];
  }

  static updateReputation(
    passengerReputation: Record<number, PassengerReputation>,
    passengerId: number,
    isPositive: boolean,
    timestamp: number = Date.now()
  ): Record<number, PassengerReputation> {
    const reputation = this.getPassengerReputation(passengerReputation, passengerId);

    reputation.interactions++;
    reputation.lastEncounter = timestamp;

    if (isPositive) {
      reputation.positiveChoices++;
    } else {
      reputation.negativeChoices++;
    }

    // Calculate relationship level based on interaction history
    const positiveRatio = reputation.positiveChoices / reputation.interactions;

    if (
      positiveRatio >= GAME_BALANCE.REPUTATION.THRESHOLDS.TRUSTED_RATIO &&
      reputation.interactions >= GAME_BALANCE.REPUTATION.THRESHOLDS.MINIMUM_INTERACTIONS_FOR_TRUSTED
    ) {
      reputation.relationshipLevel = 'trusted';
    } else if (positiveRatio >= GAME_BALANCE.REPUTATION.THRESHOLDS.FRIENDLY_RATIO) {
      reputation.relationshipLevel = 'friendly';
    } else if (positiveRatio <= GAME_BALANCE.REPUTATION.THRESHOLDS.HOSTILE_RATIO) {
      reputation.relationshipLevel = 'hostile';
    } else {
      reputation.relationshipLevel = 'neutral';
    }

    return { ...passengerReputation, [passengerId]: reputation };
  }

  static getReputationModifier(reputation: PassengerReputation): {
    fareMultiplier: number;
    riskModifier: number;
    specialOptions: string[];
  } {
    switch (reputation.relationshipLevel) {
      case 'trusted':
        return {
          fareMultiplier: GAME_BALANCE.REPUTATION.MULTIPLIERS.TRUSTED_FARE,
          riskModifier: GAME_BALANCE.REPUTATION.RISK_MODIFIERS.TRUSTED_MODIFIER,
          specialOptions: ['protective_charm', 'safe_route_info'],
        };
      case 'friendly':
        return {
          fareMultiplier: GAME_BALANCE.REPUTATION.MULTIPLIERS.FRIENDLY_FARE,
          riskModifier: GAME_BALANCE.REPUTATION.RISK_MODIFIERS.FRIENDLY_MODIFIER,
          specialOptions: ['warning_about_dangers'],
        };
      case 'hostile':
        return {
          fareMultiplier: GAME_BALANCE.REPUTATION.MULTIPLIERS.HOSTILE_FARE,
          riskModifier: GAME_BALANCE.REPUTATION.RISK_MODIFIERS.HOSTILE_MODIFIER,
          specialOptions: ['makes_demands', 'threatens_driver'],
        };
      default:
        return {
          fareMultiplier: GAME_BALANCE.REPUTATION.MULTIPLIERS.DEFAULT_FARE,
          riskModifier: GAME_BALANCE.REPUTATION.RISK_MODIFIERS.DEFAULT_MODIFIER,
          specialOptions: [],
        };
    }
  }
}

export class RouteService {
  static calculateRouteCosts(
    routeType: 'normal' | 'shortcut' | 'scenic' | 'police',
    passengerRiskLevel: number = 1,
    weather?: WeatherCondition,
    timeOfDay?: TimeOfDay,
    hazards?: EnvironmentalHazard[],
    routeMastery?: Record<string, number>,
    passenger?: import('../types/game').Passenger
  ): { fuelCost: number; timeCost: number; riskLevel: number } {
    let baseFuelCost: number;
    let baseTimeCost: number;
    let baseRiskLevel: number;

    switch (routeType) {
      case 'normal':
        baseFuelCost = GAME_CONSTANTS.FUEL_COST_NORMAL;
        baseTimeCost = GAME_CONSTANTS.TIME_COST_NORMAL;
        baseRiskLevel = GAME_CONSTANTS.RISK_NORMAL;
        break;
      case 'shortcut':
        baseFuelCost = GAME_CONSTANTS.FUEL_COST_SHORTCUT;
        baseTimeCost = GAME_CONSTANTS.TIME_COST_SHORTCUT;
        baseRiskLevel = GAME_CONSTANTS.RISK_SHORTCUT;
        break;
      case 'scenic':
        baseFuelCost = GAME_CONSTANTS.FUEL_COST_SCENIC;
        baseTimeCost = GAME_CONSTANTS.TIME_COST_SCENIC;
        baseRiskLevel = GAME_CONSTANTS.RISK_SCENIC;
        break;
      case 'police':
        baseFuelCost = GAME_CONSTANTS.FUEL_COST_POLICE;
        baseTimeCost = GAME_CONSTANTS.TIME_COST_POLICE;
        baseRiskLevel = GAME_CONSTANTS.RISK_POLICE;
        break;
    }

    // Add some randomness and passenger risk influence
    const fuelVariation = BalanceHelpers.getFuelCostWithVariation(baseFuelCost) - baseFuelCost;
    const timeVariation = BalanceHelpers.getTimeCostWithVariation(baseTimeCost) - baseTimeCost;

    let finalFuelCost = baseFuelCost + fuelVariation;
    let finalTimeCost = baseTimeCost + timeVariation;
    let finalRiskLevel =
      baseRiskLevel + (passengerRiskLevel - GAME_BALANCE.PASSENGER_SELECTION.DEFAULT_RISK_LEVEL);

    // Apply weather effects if provided
    if (weather && timeOfDay) {
      const weatherEffects = WeatherService.applyWeatherEffects(
        finalFuelCost,
        finalTimeCost,
        finalRiskLevel,
        weather,
        timeOfDay
      );
      finalFuelCost = weatherEffects.fuel;
      finalTimeCost = weatherEffects.time;
      finalRiskLevel = weatherEffects.risk;
    }

    // Apply additional penalties for dangerous conditions instead of blocking
    if (weather) {
      // Heavy weather makes routes more dangerous but not impossible
      if (
        routeType === 'shortcut' &&
        weather.intensity === 'heavy' &&
        (weather.type === 'rain' || weather.type === 'fog' || weather.type === 'snow')
      ) {
        finalFuelCost += 8; // Extra fuel for careful driving
        finalTimeCost += 10; // Extra time for safety
        finalRiskLevel = Math.min(5, finalRiskLevel + 2); // Much more dangerous
      }

      if (routeType === 'scenic' && weather.type === 'thunderstorm') {
        finalFuelCost += 5; // Extra fuel for detours around storm damage
        finalTimeCost += 15; // Much slower due to conditions
        finalRiskLevel = Math.min(5, finalRiskLevel + 1); // More dangerous
      }
    }

    // Apply time-based penalties
    if (timeOfDay) {
      if (routeType === 'scenic' && timeOfDay.phase === 'latenight') {
        finalFuelCost += 3; // Need headlights and careful driving
        finalTimeCost += 8; // Slower speeds for safety
        finalRiskLevel = Math.min(5, finalRiskLevel + 1); // Higher crime risk at night
      }
    }

    // Apply passenger fear penalties instead of random blocking
    if (passenger) {
      const strongFear = passenger.routePreferences?.find(
        pref => pref.route === routeType && pref.preference === 'fears'
      );
      if (strongFear) {
        // Passenger fear makes routes slightly more expensive
        finalFuelCost += 2; // Reduced from 3 - small penalty
        finalTimeCost += 3; // Reduced from 5 - small delay
        finalRiskLevel = Math.min(5, finalRiskLevel + 1); // Slightly more dangerous
      }
    }

    // Apply hazard effects if any
    if (hazards && hazards.length > 0) {
      for (const hazard of hazards) {
        // Check if hazard blocks this route type
        if (hazard.effects.routeBlocked?.includes(routeType)) {
          finalRiskLevel = Math.min(5, finalRiskLevel + 2); // Route is risky due to blockage
        }

        if (hazard.effects.fuelIncrease) {
          finalFuelCost += hazard.effects.fuelIncrease;
        }

        if (hazard.effects.timeDelay) {
          finalTimeCost += hazard.effects.timeDelay;
        }

        if (hazard.effects.riskIncrease) {
          finalRiskLevel += hazard.effects.riskIncrease;
        }
      }
    }

    // Apply route mastery bonuses
    if (routeMastery && routeMastery[routeType]) {
      const masteryLevel = routeMastery[routeType];
      const fuelReduction = Math.min(4, Math.floor(masteryLevel / 3)); // -1 fuel per 3 uses, max -4
      const timeReduction = Math.min(6, Math.floor(masteryLevel / 2)); // -1 time per 2 uses, max -6
      const riskReduction = Math.min(1, Math.floor(masteryLevel / 10)); // -1 risk per 10 uses, max -1

      finalFuelCost = Math.max(
        GAME_BALANCE.ROUTE_VARIATIONS.MINIMUM_FUEL_COST,
        finalFuelCost - fuelReduction
      );
      finalTimeCost = Math.max(
        GAME_BALANCE.ROUTE_VARIATIONS.MINIMUM_TIME_COST,
        finalTimeCost - timeReduction
      );
      finalRiskLevel = Math.max(GAME_BALANCE.RISK_LEVELS.SAFE, finalRiskLevel - riskReduction);
    }

    // Apply severe penalties for previously blocked conditions (instead of making routes unavailable)
    // These are now just very expensive/risky rather than impossible
    // Note: routeConsequences would need to be passed as parameter for full implementation

    return {
      fuelCost: Math.max(
        GAME_BALANCE.ROUTE_VARIATIONS.MINIMUM_FUEL_COST,
        Math.round(finalFuelCost)
      ),
      timeCost: Math.max(
        GAME_BALANCE.ROUTE_VARIATIONS.MINIMUM_TIME_COST,
        Math.round(finalTimeCost)
      ),
      riskLevel: Math.max(GAME_BALANCE.RISK_LEVELS.SAFE, Math.min(5, Math.round(finalRiskLevel))),
    };
  }

  static getRouteOptions(
    currentFuel: number,
    currentTime: number,
    passengerRiskLevel: number = 1,
    weather?: WeatherCondition,
    timeOfDay?: TimeOfDay,
    hazards?: EnvironmentalHazard[],
    passenger?: import('../types/game').Passenger,
    routeMastery?: Record<string, number>,
    routeConsequences?: string[],
    playerStats?: PlayerStats
  ): GameResult<
    Array<{
      type: 'normal' | 'shortcut' | 'scenic' | 'police';
      name: string;
      description: string;
      fuelCost: number;
      timeCost: number;
      riskLevel: number;
      available: boolean;
      bonusInfo?: string;
      passengerReaction?: 'positive' | 'negative' | 'neutral';
      fareModifier?: number;
    }>
  > {
    return ErrorHandling.wrap(
      () => {
        // Handle negative values gracefully instead of throwing errors
        const safeFuel = Math.max(0, currentFuel);
        const safeTime = Math.max(0, currentTime);

        const routes = [
          {
            type: 'normal' as const,
            name: 'Take Normal Route',
            description: 'Safe and reliable, follows GPS exactly',
          },
          {
            type: 'shortcut' as const,
            name: 'Take Shortcut',
            description: 'Faster and saves fuel, but higher risk of supernatural encounters',
          },
          {
            type: 'scenic' as const,
            name: 'Take Scenic Route',
            description: 'Longer route through beautiful areas, passenger pays bonus',
          },
          {
            type: 'police' as const,
            name: 'Police-Patrolled Route',
            description: 'Safest option, but uses more fuel and time',
          },
        ];

        const resultRoutes = routes.map(route => {
          try {
            const costs = this.calculateRouteCosts(
              route.type,
              passengerRiskLevel,
              weather,
              timeOfDay,
              hazards,
              routeMastery,
              passenger
            );

            // ALL ROUTES ARE ALWAYS AVAILABLE - no fuel/time restrictions
            let available = true;

            // checkRouteAvailability always returns true now, but keeping for future flexibility
            available =
              available &&
              this.checkRouteAvailability(
                route.type,
                weather,
                timeOfDay,
                routeConsequences,
                passenger
              );

            // Get passenger preference for this route
            const passengerPreference = passenger?.routePreferences?.find(
              pref => pref.route === route.type
            );
            const passengerReaction = passengerPreference
              ? this.getReactionFromPreference(passengerPreference.preference)
              : 'neutral';
            const fareModifier = passengerPreference?.fareModifier || 1.0;

            const bonusInfo = this.buildRouteInfo(
              route.type,
              passengerPreference,
              routeMastery,
              weather,
              hazards,
              timeOfDay,
              passenger,
              playerStats
            );

            const routeResult = {
              ...route,
              ...costs,
              available,
              bonusInfo,
              passengerReaction,
              fareModifier,
            };

            return routeResult;
          } catch {
            // Return a basic route if processing fails
            return {
              ...route,
              fuelCost: 15,
              timeCost: 20,
              riskLevel: 1,
              available: safeFuel >= 15 && safeTime >= 20,
              bonusInfo: 'Basic route (error recovery)',
              passengerReaction: 'neutral' as const,
              fareModifier: 1.0,
            };
          }
        });

        return resultRoutes;
      },
      'route_options_failed',
      [] // Empty array as fallback
    );
  }

  /**
   * Check if a route is available based on current game conditions
   * ALL ROUTES ARE ALWAYS AVAILABLE - no route blocking, only penalties
   */
  static checkRouteAvailability(
    _routeType: 'normal' | 'shortcut' | 'scenic' | 'police',
    _weather?: WeatherCondition,
    _timeOfDay?: TimeOfDay,
    _routeConsequences?: string[],
    _passenger?: import('../types/game').Passenger
  ): boolean {
    // ALL ROUTES ARE ALWAYS AVAILABLE
    // Former blocking conditions now just add severe penalties instead of disabling routes
    return true;
  }

  /**
   * Build informative text about route choice including passenger reactions
   * Information is hidden based on Almanac knowledge level
   */
  static buildRouteInfo(
    routeType: 'normal' | 'shortcut' | 'scenic' | 'police',
    passengerPreference?: import('../types/game').RoutePreference,
    routeMastery?: Record<string, number>,
    weather?: WeatherCondition,
    hazards?: EnvironmentalHazard[],
    timeOfDay?: import('../types/game').TimeOfDay,
    passenger?: import('../types/game').Passenger,
    playerStats?: PlayerStats
  ): string {
    const infoSections: string[] = [];

    // Check knowledge level if we have passenger and playerStats
    const passengerId = passenger?.id;
    const canSeePreferences =
      passengerId && playerStats
        ? AlmanacHelper.canSeePreferences(playerStats, passengerId)
        : false;
    const canSeeFareModifiers =
      passengerId && playerStats
        ? AlmanacHelper.canSeeFareModifiers(playerStats, passengerId)
        : false;

    // Base route benefits - only show fare modifiers if knowledge level >= 2
    switch (routeType) {
      case 'scenic':
        if (canSeeFareModifiers) {
          const bonus = passengerPreference?.fareModifier
            ? Math.round((passengerPreference.fareModifier - 1) * 100)
            : 10;
          infoSections.push(`+${bonus}% fare bonus`);
        } else if (passengerId && playerStats) {
          // Show locked indicator
          infoSections.push('🔒 Fare bonus (Unlock in Almanac)');
        }
        break;
      case 'police':
        infoSections.push('No supernatural encounters');
        break;
      case 'shortcut':
        infoSections.push('Risk of supernatural encounters');
        break;
    }

    // Passenger reaction - only show if knowledge level >= 2
    if (passengerPreference && canSeePreferences) {
      const reactionText = {
        loves: '😍 Passenger loves this route',
        likes: '😊 Passenger likes this route',
        neutral: '😐 Passenger is indifferent',
        dislikes: '😒 Passenger dislikes this route',
        fears: '😨 PASSENGER FEAR: +2 fuel, +3 min, +1 risk',
      }[passengerPreference.preference];

      if (reactionText && passengerPreference.preference !== 'neutral') {
        infoSections.push(reactionText);
      }
    } else if (passengerPreference && passengerId && playerStats && !canSeePreferences) {
      // Show locked indicator for preferences
      if (passengerPreference.preference !== 'neutral') {
        infoSections.push('🔒 Passenger preference (Unlock in Almanac)');
      }
    }

    // Mastery bonuses - always visible (player's own progress)
    if (routeMastery && routeMastery[routeType] >= 5) {
      const level = routeMastery[routeType];
      if (level >= 10) {
        infoSections.push('⭐ Master level - Max bonuses');
      } else {
        infoSections.push(`✨ Experienced (${level} uses) - Reduced costs`);
      }
    }

    // Weather warnings - always visible (environmental conditions)
    if (weather) {
      if (weather.intensity === 'heavy') {
        if (
          routeType === 'shortcut' &&
          (weather.type === 'rain' || weather.type === 'fog' || weather.type === 'snow')
        ) {
          infoSections.push(`⚠️ DANGEROUS: Heavy ${weather.type} (+8 fuel, +10 min, +2 risk)`);
        } else if (routeType === 'scenic' && weather.type === 'thunderstorm') {
          infoSections.push(`⚠️ RISKY: Storm damage (+5 fuel, +15 min, +1 risk)`);
        } else {
          infoSections.push(`🌦️ Heavy ${weather.type} conditions`);
        }
      }
    }

    // Time-based warnings - always visible
    if (timeOfDay && routeType === 'scenic' && timeOfDay.phase === 'latenight') {
      infoSections.push('🌙 NIGHT RISK: +3 fuel, +8 min, +1 risk');
    }

    // Hazard warnings - always visible
    if (hazards && hazards.length > 0) {
      const routeHazards = hazards.filter(h => h.effects.routeBlocked?.includes(routeType));
      if (routeHazards.length > 0) {
        infoSections.push('⚠️ Route affected by hazards - increased costs');
      }
    }

    return infoSections.join(' • ');
  }

  /**
   * Convert preference level to reaction type
   */
  static getReactionFromPreference(preference: string): 'positive' | 'negative' | 'neutral' {
    switch (preference) {
      case 'loves':
      case 'likes':
        return 'positive';
      case 'dislikes':
      case 'fears':
        return 'negative';
      default:
        return 'neutral';
    }
  }
}
