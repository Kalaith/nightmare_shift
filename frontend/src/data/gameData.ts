import type { GameData } from '../types/gameData';
import { shiftRulesData } from './shiftRulesData';
import { passengerData } from './passengerData';
import { locationData } from './locationData';

// Complete game data including rules, passengers, and locations
export const gameData: GameData = {
  shift_rules: shiftRulesData,
  passengers: passengerData,
  locations: locationData
};