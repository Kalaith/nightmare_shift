import type {
  StorageKeys,
  GameConstants,
  RarityWeights,
} from "../types/constants";

export const STORAGE_KEYS: StorageKeys = {
  PLAYER_STATS: "nightshift_player_stats",
  LEADERBOARD: "nightshift_leaderboard",
  SAVE_GAME: "nightshift_saved_game",
  BACKSTORY_PROGRESS: "nightshift_backstories",
};

export const GAME_CONSTANTS: GameConstants = {
  INITIAL_FUEL: 100,
  INITIAL_TIME: 480, // 8 hours in minutes
  SURVIVAL_BONUS: 50,
  BACKSTORY_UNLOCK_FIRST: 0.2,
  BACKSTORY_UNLOCK_REPEAT: 0.5,
  MINIMUM_EARNINGS: 200, // Increased from 80 - requires strategic play to succeed
  // Route costs (fuel in liters, time in minutes)
  // Reduced by 50% total from original values to make game winnable
  FUEL_COST_SHORTCUT: 4, // Was 5 (originally 8) - 20% reduction
  FUEL_COST_NORMAL: 7, // Was 9 (originally 15) - 22% reduction
  FUEL_COST_SCENIC: 12, // Was 15 (originally 25) - 20% reduction
  FUEL_COST_POLICE: 10, // Was 12 (originally 20) - 17% reduction

  TIME_COST_SHORTCUT: 22, // Was 20 - Adjusted to limit rides to ~22 max
  TIME_COST_NORMAL: 30, // Was 28 - Adjusted to limit rides to ~16 max
  TIME_COST_SCENIC: 38, // Was 35 - Adjusted to limit rides to ~12 max
  TIME_COST_POLICE: 27, // Was 25 - Adjusted to limit rides to ~18 max
  // Route risk levels
  RISK_NORMAL: 1,
  RISK_SHORTCUT: 3,
  RISK_SCENIC: 2,
  RISK_POLICE: 0,
};

export const RARITY_WEIGHTS: RarityWeights = {
  common: 70,
  rare: 29,
  legendary: 1,
};

export const SCREENS = {
  LOADING: "loading",
  LEADERBOARD: "leaderboard",
  BRIEFING: "briefing",
  GAME: "game",
  GAME_OVER: "gameOver",
  SUCCESS: "success",
  SKILL_TREE: "skillTree",
  ALMANAC: "almanac",
} as const;

export const GAME_PHASES = {
  WAITING: "waiting",
  RIDE_REQUEST: "rideRequest",
  DRIVING: "driving",
  INTERACTION: "interaction",
  DROP_OFF: "dropOff",
} as const;
