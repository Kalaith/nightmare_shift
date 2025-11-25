import type { StorageKeys, GameConstants, RarityWeights } from '../types/constants';

export const STORAGE_KEYS: StorageKeys = {
  PLAYER_STATS: 'nightshift_player_stats',
  LEADERBOARD: 'nightshift_leaderboard',
  SAVE_GAME: 'nightshift_saved_game',
  BACKSTORY_PROGRESS: 'nightshift_backstories'
};

export const GAME_CONSTANTS: GameConstants = {
  INITIAL_FUEL: 100,
  INITIAL_TIME: 480, // 8 hours in minutes
  SURVIVAL_BONUS: 50,
  BACKSTORY_UNLOCK_FIRST: 0.2,
  BACKSTORY_UNLOCK_REPEAT: 0.5,
  MINIMUM_EARNINGS: 80, // Reduced to make game winnable
  // Route costs (fuel in liters, time in minutes)
  // Reduced by 40% total from original values to make game winnable
  FUEL_COST_SHORTCUT: 5,    // Was 6 (originally 8)
  FUEL_COST_NORMAL: 9,       // Was 10 (originally 15)
  FUEL_COST_SCENIC: 15,      // Was 18 (originally 25)
  FUEL_COST_POLICE: 12,      // Was 14 (originally 20)

  TIME_COST_SHORTCUT: 7,     // Was 8 (originally 12)
  TIME_COST_NORMAL: 12,      // Was 14 (originally 20)
  TIME_COST_SCENIC: 21,      // Was 25 (originally 35)
  TIME_COST_POLICE: 15,      // Was 18 (originally 25)
  // Route risk levels
  RISK_NORMAL: 1,
  RISK_SHORTCUT: 3,
  RISK_SCENIC: 2,
  RISK_POLICE: 0
};

export const RARITY_WEIGHTS: RarityWeights = {
  common: 70,
  rare: 29,
  legendary: 1
};

export const SCREENS = {
  LOADING: 'loading',
  LEADERBOARD: 'leaderboard',
  BRIEFING: 'briefing',
  GAME: 'game',
  GAME_OVER: 'gameOver',
  SUCCESS: 'success'
} as const;

export const GAME_PHASES = {
  WAITING: 'waiting',
  RIDE_REQUEST: 'rideRequest',
  DRIVING: 'driving',
  INTERACTION: 'interaction',
  DROP_OFF: 'dropOff'
} as const;