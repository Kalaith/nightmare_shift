export interface StorageKeys {
  PLAYER_STATS: string;
  LEADERBOARD: string;
  SAVE_GAME: string;
  BACKSTORY_PROGRESS: string;
}

export interface GameConstants {
  INITIAL_FUEL: number;
  INITIAL_TIME: number;
  SURVIVAL_BONUS: number;
  BACKSTORY_UNLOCK_FIRST: number;
  BACKSTORY_UNLOCK_REPEAT: number;
  MINIMUM_EARNINGS: number;
  // Route fuel costs
  FUEL_COST_NORMAL: number;
  FUEL_COST_SHORTCUT: number;
  FUEL_COST_SCENIC: number;
  FUEL_COST_POLICE: number;
  // Route time costs
  TIME_COST_NORMAL: number;
  TIME_COST_SHORTCUT: number;
  TIME_COST_SCENIC: number;
  TIME_COST_POLICE: number;
  // Route risk levels
  RISK_NORMAL: number;
  RISK_SHORTCUT: number;
  RISK_SCENIC: number;
  RISK_POLICE: number;
}

export interface RarityWeights {
  common: number;
  rare: number;
  legendary: number;
}

export interface Screens {
  LOADING: string;
  LEADERBOARD: string;
  BRIEFING: string;
  GAME: string;
  GAME_OVER: string;
  SUCCESS: string;
}

export interface GamePhases {
  WAITING: string;
  RIDE_REQUEST: string;
  DRIVING: string;
  INTERACTION: string;
  DROP_OFF: string;
}
