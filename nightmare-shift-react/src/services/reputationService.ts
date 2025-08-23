import type { PassengerReputation, RouteChoice } from '../types/game';
import { GAME_CONSTANTS } from '../data/constants';

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
    
    if (positiveRatio >= 0.8 && reputation.interactions >= 3) {
      reputation.relationshipLevel = 'trusted';
    } else if (positiveRatio >= 0.6) {
      reputation.relationshipLevel = 'friendly';
    } else if (positiveRatio <= 0.3) {
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
          fareMultiplier: 1.5,
          riskModifier: -1,
          specialOptions: ['protective_charm', 'safe_route_info']
        };
      case 'friendly':
        return {
          fareMultiplier: 1.2,
          riskModifier: 0,
          specialOptions: ['warning_about_dangers']
        };
      case 'hostile':
        return {
          fareMultiplier: 0.7,
          riskModifier: 2,
          specialOptions: ['makes_demands', 'threatens_driver']
        };
      default:
        return {
          fareMultiplier: 1.0,
          riskModifier: 0,
          specialOptions: []
        };
    }
  }
}

export class RouteService {
  static calculateRouteCosts(
    routeType: 'normal' | 'shortcut' | 'scenic' | 'police',
    passengerRiskLevel: number = 1
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
    const fuelVariation = Math.floor(Math.random() * 6) - 3; // ±3 fuel
    const timeVariation = Math.floor(Math.random() * 10) - 5; // ±5 minutes
    
    return {
      fuelCost: Math.max(5, baseFuelCost + fuelVariation),
      timeCost: Math.max(5, baseTimeCost + timeVariation),
      riskLevel: Math.max(0, baseRiskLevel + (passengerRiskLevel - 1))
    };
  }

  static getRouteOptions(
    currentFuel: number, 
    currentTime: number,
    passengerRiskLevel: number = 1
  ): Array<{
    type: 'normal' | 'shortcut' | 'scenic' | 'police';
    name: string;
    description: string;
    fuelCost: number;
    timeCost: number;
    riskLevel: number;
    available: boolean;
    bonusInfo?: string;
  }> {
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
      const costs = this.calculateRouteCosts(route.type, passengerRiskLevel);
      const available = currentFuel >= costs.fuelCost && currentTime >= costs.timeCost;
      
      let bonusInfo = '';
      if (route.type === 'scenic') {
        bonusInfo = 'Passenger pays +$10 bonus';
      } else if (route.type === 'police') {
        bonusInfo = 'No supernatural encounters';
      } else if (route.type === 'shortcut') {
        bonusInfo = 'May trigger hidden rules';
      }

      return {
        ...route,
        ...costs,
        available,
        bonusInfo
      };
    });
  }
}