// Game data structure types
import type { Rule } from "./rules";
import type { Passenger } from "./passenger";
import type { Location } from "./location";

export interface GameData {
  shift_rules: Rule[];
  passengers: Passenger[];
  locations: Location[];
}

export interface SaveData {
  gameState: any; // Will be properly typed when needed
  playerStats: any; // Will be properly typed when needed
  timestamp: number;
  version: string;
}
