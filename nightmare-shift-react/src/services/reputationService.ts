import type { PassengerReputation, RouteChoice, WeatherCondition, TimeOfDay, EnvironmentalHazard } from '../types/game';
import { GAME_CONSTANTS } from '../data/constants';
import { GAME_BALANCE, BalanceHelpers } from '../constants/gameBalance';
import { WeatherService } from './weatherService';
import { ErrorHandling, type GameResult } from '../utils/errorHandling';

export class ReputationService {
  static initializeReputation(): Record<number, PassengerReputation> {
    return {};
  }

  static getPassengerReputation(passengerReputation: Record<number, PassengerReputation>, passengerId: number): PassengerReputation {
    if (!passengerReputation[passengerId]) {
      passengerReputation[passengerId] = {
        interactions: 0,
        positiveChoices: 0,
        negativeChoices: 0,
        lastEncounter: 0,
        relationshipLevel: 'neutral',
        specialUnlocks: []
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
    
    if (positiveRatio >= GAME_BALANCE.REPUTATION.THRESHOLDS.TRUSTED_RATIO && 
        reputation.interactions >= GAME_BALANCE.REPUTATION.THRESHOLDS.MINIMUM_INTERACTIONS_FOR_TRUSTED) {
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
          specialOptions: ['protective_charm', 'safe_route_info']
        };
      case 'friendly':
        return {
          fareMultiplier: GAME_BALANCE.REPUTATION.MULTIPLIERS.FRIENDLY_FARE,
          riskModifier: GAME_BALANCE.REPUTATION.RISK_MODIFIERS.FRIENDLY_MODIFIER,
          specialOptions: ['warning_about_dangers']
        };
      case 'hostile':
        return {
          fareMultiplier: GAME_BALANCE.REPUTATION.MULTIPLIERS.HOSTILE_FARE,
          riskModifier: GAME_BALANCE.REPUTATION.RISK_MODIFIERS.HOSTILE_MODIFIER,
          specialOptions: ['makes_demands', 'threatens_driver']
        };
      default:
        return {
          fareMultiplier: GAME_BALANCE.REPUTATION.MULTIPLIERS.DEFAULT_FARE,
          riskModifier: GAME_BALANCE.REPUTATION.RISK_MODIFIERS.DEFAULT_MODIFIER,
          specialOptions: []
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
    hazards?: EnvironmentalHazard[]
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
    let finalRiskLevel = baseRiskLevel + (passengerRiskLevel - GAME_BALANCE.PASSENGER_SELECTION.DEFAULT_RISK_LEVEL);

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
    
    return {
      fuelCost: Math.max(GAME_BALANCE.ROUTE_VARIATIONS.MINIMUM_FUEL_COST, Math.round(finalFuelCost)),
      timeCost: Math.max(GAME_BALANCE.ROUTE_VARIATIONS.MINIMUM_TIME_COST, Math.round(finalTimeCost)),
      riskLevel: Math.max(GAME_BALANCE.RISK_LEVELS.SAFE, Math.min(5, Math.round(finalRiskLevel)))
    };
  }

  static getRouteOptions(
    currentFuel: number, 
    currentTime: number,
    passengerRiskLevel: number = 1,
    weather?: WeatherCondition,
    timeOfDay?: TimeOfDay,
    hazards?: EnvironmentalHazard[]
  ): GameResult<Array<{
    type: 'normal' | 'shortcut' | 'scenic' | 'police';
    name: string;
    description: string;
    fuelCost: number;
    timeCost: number;
    riskLevel: number;
    available: boolean;
    bonusInfo?: string;
  }>> {
    return ErrorHandling.wrap(
      () => {
        if (currentFuel < 0 || currentTime < 0) {
          throw ErrorHandling.serviceError('RouteService', 'getRouteOptions', 'Invalid fuel or time values');
        }

        const routes = [
          {
            type: 'normal' as const,
            name: 'Take Normal Route',
            description: 'Safe and reliable, follows GPS exactly'
          },
          {
            type: 'shortcut' as const,
            name: 'Take Shortcut',
            description: 'Faster and saves fuel, but higher risk of supernatural encounters'
          },
          {
            type: 'scenic' as const,
            name: 'Take Scenic Route', 
            description: 'Longer route through beautiful areas, passenger pays bonus'
          },
          {
            type: 'police' as const,
            name: 'Police-Patrolled Route',
            description: 'Safest option, but uses more fuel and time'
          }
        ];

        return routes.map(route => {
          const costs = this.calculateRouteCosts(route.type, passengerRiskLevel, weather, timeOfDay, hazards);
          const available = currentFuel >= costs.fuelCost && currentTime >= costs.timeCost;
          
          let bonusInfo = '';
          if (route.type === 'scenic') {
            bonusInfo = 'Passenger pays +$10 bonus';
          } else if (route.type === 'police') {
            bonusInfo = 'No supernatural encounters';
          } else if (route.type === 'shortcut') {
            bonusInfo = 'May trigger hidden rules';
          }

          // Add weather and hazard warnings
          if (weather && weather.intensity === 'heavy') {
            bonusInfo += bonusInfo ? ' • ' : '';
            bonusInfo += `Heavy ${weather.type} conditions`;
          }

          if (hazards && hazards.length > 0) {
            const routeHazards = hazards.filter(h => h.effects.routeBlocked?.includes(route.type));
            if (routeHazards.length > 0) {
              bonusInfo += bonusInfo ? ' • ' : '';
              bonusInfo += '⚠️ Route affected by hazards';
            }
          }

          return {
            ...route,
            ...costs,
            available,
            bonusInfo
          };
        });
      },
      'route_options_failed',
      [] // Empty array as fallback
    );
  }
}