/**
 * Game Balance Constants
 * 
 * This file centralizes all magic numbers and game balance parameters
 * to make gameplay tuning easier and prevent bugs from hard-coded values.
 * 
 * All timing values are in milliseconds unless otherwise specified.
 * All probabilities are in decimal format (0.0-1.0).
 * All thresholds and costs are in their respective units (fuel %, dollars, minutes).
 */

export const GAME_BALANCE = {
  // ===== FUEL SYSTEM =====
  FUEL_THRESHOLDS: {
    LOW_FUEL_WARNING: 20,
    CRITICAL_FUEL: 10,
    EMPTY_TANK: 0,
    FUEL_CHECK_MINIMUM: 5, // Minimum fuel needed to accept rides
  },

  FUEL_COSTS: {
    PER_PERCENT: 0.5, // $0.50 per fuel percentage point
  },

  // ===== TIMING SYSTEM =====
  TIMING: {
    // Ride request delays
    RIDE_REQUEST_BASE_DELAY: 2000,
    RIDE_REQUEST_RANDOM_DELAY: 3000,
    
    // Passenger interaction delays
    PASSENGER_INTERACTION_DELAY: 1500,
    DIALOGUE_DISPLAY_DELAY: 1000,
    
    // Game progression delays
    GAME_START_DELAY: 2000,
    SHIFT_END_DELAY: 3000,
    SHIFT_END_RANDOM_DELAY: 4000,
    
    // Time conversion
    MINUTES_TO_MS: 60 * 1000,
    
    // Time thresholds
    SHIFT_END_WARNING_THRESHOLD: 60, // minutes
    CRITICAL_TIME_THRESHOLD: 15, // minutes
  },

  // ===== PROBABILITIES =====
  PROBABILITIES: {
    // Supernatural encounters
    SUPERNATURAL_ENCOUNTER: 0.3,
    HIGH_RISK_ENCOUNTER: 0.3,
    
    // Item and backstory drops
    ITEM_DROP: 0.4,
    BACKSTORY_UNLOCK_FIRST: 0.2,
    BACKSTORY_UNLOCK_REPEAT: 0.5,
    
    // Game events
    HIDDEN_RULE_VIOLATION: 0.3,
    ROUTE_VARIATION: 0.5, // For random route cost variations
    
    // Passenger-related probabilities
    RELATED_PASSENGER_SPAWN: 0.3, // 30% chance to spawn related passenger
    RELATED_PASSENGER_SELECTION: 0.5, // 50% chance to select specific related passenger
  },

  // ===== RISK LEVELS =====
  RISK_LEVELS: {
    SAFE: 0,
    LOW_RISK: 1,
    MEDIUM_RISK: 2,
    HIGH_RISK: 3,
    EXTREME_RISK: 4,
    MAX_RISK_LEVEL: 4,
    SUPERNATURAL_THRESHOLD: 2, // Risk level above which supernatural encounters can occur
  },

  // ===== REPUTATION SYSTEM =====
  REPUTATION: {
    THRESHOLDS: {
      TRUSTED_RATIO: 0.8,
      FRIENDLY_RATIO: 0.6,
      HOSTILE_RATIO: 0.3,
      MINIMUM_INTERACTIONS_FOR_TRUSTED: 3,
    },
    
    MULTIPLIERS: {
      TRUSTED_FARE: 1.5,
      FRIENDLY_FARE: 1.2,
      HOSTILE_FARE: 0.7,
      DEFAULT_FARE: 1.0,
    },
    
    RISK_MODIFIERS: {
      TRUSTED_MODIFIER: -1,
      FRIENDLY_MODIFIER: 0,
      HOSTILE_MODIFIER: 2,
      DEFAULT_MODIFIER: 0,
    },
  },

  // ===== ROUTE COST VARIATIONS =====
  ROUTE_VARIATIONS: {
    FUEL_VARIATION_RANGE: 6, // ±3 fuel
    FUEL_VARIATION_OFFSET: 3,
    TIME_VARIATION_RANGE: 10, // ±5 minutes
    TIME_VARIATION_OFFSET: 5,
    MINIMUM_FUEL_COST: 5,
    MINIMUM_TIME_COST: 5,
  },

  // ===== SCORING SYSTEM =====
  SCORING: {
    PLAYER_EXPERIENCE_MULTIPLIERS: {
      RIDES_COMPLETED: 1,
      SHIFTS_COMPLETED: 10,
      EXPERIENCE_LEGACY: 2, // For old calculation
    },
    
    GAME_SCORE_BONUSES: {
      TIME_BONUS_MULTIPLIER: 2,
      RIDE_BONUS: 10,
      SURVIVAL_BONUS: 50,
      RULE_VIOLATION_PENALTY: 10,
    },
    
    DIFFICULTY_SCALING: {
      MAX_DIFFICULTY: 4,
      EXPERIENCE_PER_LEVEL: 10,
    },
  },

  // ===== BONUS PAYMENTS =====
  PAYMENTS: {
    SCENIC_ROUTE_BONUS: 10,
    BASE_PASSENGER_FARES: {
      COMMON: 20,
      RARE: 30,
      LEGENDARY: 50,
    },
  },

  // ===== RULE GENERATION =====
  RULE_GENERATION: {
    BASIC_RULES_MIN: 2,
    BASIC_RULES_RANDOM_ADDITIONAL: 2,
    CONDITIONAL_RULES_MAX: 2,
    CONDITIONAL_RULES_MIN_DIFFICULTY: 1,
    SHUFFLE_BIAS: 0.5, // For Math.random() - 0.5 shuffle
  },

  // ===== TIME FORMATTING =====
  TIME_FORMATTING: {
    MINUTES_PER_HOUR: 60,
    HOURS_DISPLAY_THRESHOLD: 60, // Show hours when >= 60 minutes
    PAD_START_LENGTH: 2,
    PAD_CHARACTER: '0',
  },

  // ===== VALIDATION THRESHOLDS =====
  VALIDATION: {
    MIN_ARRAY_LENGTH: 0,
    DEFAULT_WEIGHT: 1,
    PERCENTAGE_PRECISION: 100,
    JSON_PARSE_TIMEOUT: 5000,
  },

  // ===== PASSENGER SELECTION =====
  PASSENGER_SELECTION: {
    DEFAULT_RISK_LEVEL: 1,
    RISK_LEVEL_NOT_FOUND: 1,
  },

  // ===== UI CONSTANTS =====
  UI: {
    MODAL_Z_INDEX: 50,
    INVENTORY_MAX_HEIGHT: 96, // in rem units for max-h-96
    PROGRESS_BAR_MAX: 100,
    BUTTON_TRANSITION_DURATION: 200, // CSS transition duration in ms
  },
} as const;

// Type-safe access to nested constants
export type GameBalanceConfig = typeof GAME_BALANCE;

// Helper functions for common balance calculations
export const BalanceHelpers = {
  /**
   * Calculate fuel cost with variation
   */
  getFuelCostWithVariation: (baseCost: number): number => {
    const variation = Math.floor(Math.random() * GAME_BALANCE.ROUTE_VARIATIONS.FUEL_VARIATION_RANGE) 
                     - GAME_BALANCE.ROUTE_VARIATIONS.FUEL_VARIATION_OFFSET;
    return Math.max(GAME_BALANCE.ROUTE_VARIATIONS.MINIMUM_FUEL_COST, baseCost + variation);
  },

  /**
   * Calculate time cost with variation
   */
  getTimeCostWithVariation: (baseCost: number): number => {
    const variation = Math.floor(Math.random() * GAME_BALANCE.ROUTE_VARIATIONS.TIME_VARIATION_RANGE) 
                     - GAME_BALANCE.ROUTE_VARIATIONS.TIME_VARIATION_OFFSET;
    return Math.max(GAME_BALANCE.ROUTE_VARIATIONS.MINIMUM_TIME_COST, baseCost + variation);
  },

  /**
   * Check if fuel is critically low
   */
  isFuelCritical: (fuel: number): boolean => {
    return fuel <= GAME_BALANCE.FUEL_THRESHOLDS.CRITICAL_FUEL;
  },

  /**
   * Check if fuel is at warning level
   */
  isFuelLow: (fuel: number): boolean => {
    return fuel <= GAME_BALANCE.FUEL_THRESHOLDS.LOW_FUEL_WARNING;
  },

  /**
   * Check if time is critically low
   */
  isTimeCritical: (timeRemaining: number): boolean => {
    return timeRemaining <= GAME_BALANCE.TIMING.CRITICAL_TIME_THRESHOLD;
  },

  /**
   * Calculate ride request delay with randomization
   */
  getRideRequestDelay: (): number => {
    return GAME_BALANCE.TIMING.RIDE_REQUEST_BASE_DELAY + 
           Math.random() * GAME_BALANCE.TIMING.RIDE_REQUEST_RANDOM_DELAY;
  },

  /**
   * Convert minutes to milliseconds
   */
  minutesToMs: (minutes: number): number => {
    return minutes * GAME_BALANCE.TIMING.MINUTES_TO_MS;
  },

  /**
   * Get reputation-based fare multiplier
   */
  getReputationFareMultiplier: (relationshipLevel: string): number => {
    const multipliers = GAME_BALANCE.REPUTATION.MULTIPLIERS;
    switch (relationshipLevel) {
      case 'trusted': return multipliers.TRUSTED_FARE;
      case 'friendly': return multipliers.FRIENDLY_FARE;
      case 'hostile': return multipliers.HOSTILE_FARE;
      default: return multipliers.DEFAULT_FARE;
    }
  },

  /**
   * Check if supernatural encounter should occur
   */
  shouldTriggerSupernaturalEncounter: (): boolean => {
    return Math.random() < GAME_BALANCE.PROBABILITIES.SUPERNATURAL_ENCOUNTER;
  },

  /**
   * Calculate player experience from stats
   */
  calculateExperience: (ridesCompleted: number, shiftsCompleted: number): number => {
    const multipliers = GAME_BALANCE.SCORING.PLAYER_EXPERIENCE_MULTIPLIERS;
    return ridesCompleted * multipliers.RIDES_COMPLETED + 
           shiftsCompleted * multipliers.SHIFTS_COMPLETED;
  },
};

// Export individual sections for targeted imports
export const FuelThresholds = GAME_BALANCE.FUEL_THRESHOLDS;
export const TimingConstants = GAME_BALANCE.TIMING;
export const Probabilities = GAME_BALANCE.PROBABILITIES;
export const RiskLevels = GAME_BALANCE.RISK_LEVELS;
export const ReputationConfig = GAME_BALANCE.REPUTATION;
export const ScoringConfig = GAME_BALANCE.SCORING;