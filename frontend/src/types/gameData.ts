// Game data structure types
import type { Rule } from './rules';
import type { Passenger } from './passenger';
import type { Location } from './location';
import type { GameState } from './gameState';
import type { PlayerStats } from './playerStats';

export interface GameData {
  shift_rules: Rule[];
  passengers: Passenger[];
  locations: Location[];
}

export interface SaveData {
  gameState: GameState;
  playerStats: PlayerStats;
  timestamp: number;
  version: string;
}
