import type { GameData } from '../types/gameData';
import { shiftRulesData } from './shiftRulesData';
import { passengerData } from './passengerData';
import { locationData } from './locationData';

// Complete game data including rules, passengers, and locations.
// These are hardcoded fallbacks used by the frontend game engine services.
// The authoritative data lives in the backend database — the frontend
// never fetches raw game content from the API.
export const gameData: GameData = {
  shift_rules: shiftRulesData,
  passengers: passengerData,
  locations: locationData,
};
