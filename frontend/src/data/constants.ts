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
  // Route fuel costs - REDUCED by ~30% to allow more rides
  FUEL_COST_NORMAL: 10,
  FUEL_COST_SHORTCUT: 6,
  FUEL_COST_SCENIC: 18,
  FUEL_COST_POLICE: 14,
  // Route time costs - REDUCED by ~30% to allow more rides
  TIME_COST_NORMAL: 14,
  TIME_COST_SHORTCUT: 8,
  TIME_COST_SCENIC: 25,
  TIME_COST_POLICE: 18,
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