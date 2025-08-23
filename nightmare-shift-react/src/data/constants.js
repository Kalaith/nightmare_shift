// Storage keys for localStorage
export const STORAGE_KEYS = {
  PLAYER_STATS: 'nightshift_player_stats',
  LEADERBOARD: 'nightshift_leaderboard',
  GAME_PREFERENCES: 'nightshift_preferences',
  UNLOCKED_BACKSTORIES: 'nightshift_backstories',
  SAVED_GAME: 'nightshift_saved_game'
};

// Game constants
export const GAME_CONSTANTS = {
  INITIAL_FUEL: 75,
  INITIAL_TIME: 480, // 8 hours in minutes
  FUEL_COST: 25,
  FUEL_AMOUNT: 50,
  FUEL_TIME_COST: 15,
  SURVIVAL_BONUS: 50,
  RELATIONSHIP_SPAWN_CHANCE: 0.3,
  BACKSTORY_UNLOCK_FIRST: 0.2,
  BACKSTORY_UNLOCK_REPEAT: 0.5,
  MAX_DIFFICULTY_LEVEL: 4,
  LEADERBOARD_SIZE: 10
};

// Rarity weights for passenger selection
export const RARITY_WEIGHTS = {
  common: 70,
  uncommon: 25,
  rare: 4.5,
  legendary: 0.5
};

// Screen names
export const SCREENS = {
  LOADING: 'loading',
  LEADERBOARD: 'leaderboard',
  BRIEFING: 'briefing',
  GAME: 'game',
  GAME_OVER: 'gameOver',
  SUCCESS: 'success'
};

// Game phases
export const GAME_PHASES = {
  WAITING: 'waiting',
  RIDE_REQUEST: 'rideRequest',
  DRIVING: 'driving',
  INTERACTION: 'interaction'
};