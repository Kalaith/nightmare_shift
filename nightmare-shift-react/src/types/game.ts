export interface Rule {
  id: number;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert' | 'nightmare';
  type: 'basic' | 'conditional' | 'conflicting' | 'hidden' | 'weather';
  visible: boolean;
  conflictsWith?: number[];
  trigger?: string;
  violationMessage?: string;
  condition?: (gameState: GameState, passenger: Passenger) => boolean;
  conditionHint?: string;
  checkViolation?: (gameState: GameState) => boolean;
  temporary?: boolean;
  duration?: number;
}

export interface Passenger {
  id: number;
  name: string;
  emoji: string;
  description: string;
  pickup: string;
  destination: string;
  personalRule: string;
  supernatural: string;
  fare: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  items: string[];
  dialogue: string[];
  relationships: number[];
  backstoryUnlocked: boolean;
  backstoryDetails: string;
  ruleModification?: {
    canModify: boolean;
    type: 'remove_rule' | 'reveal_hidden' | 'add_temporary';
    description: string;
    newRule?: {
      id: number;
      title: string;
      description: string;
      difficulty: 'easy' | 'medium' | 'hard' | 'expert' | 'nightmare';
      temporary: boolean;
      duration: number;
    };
  };
}

export interface Location {
  name: string;
  description: string;
  atmosphere: string;
  riskLevel: number;
}

export interface GameState {
  currentScreen: string;
  fuel: number;
  earnings: number;
  timeRemaining: number;
  ridesCompleted: number;
  rulesViolated: number;
  currentRules: Rule[];
  hiddenRules?: Rule[];
  inventory: InventoryItem[];
  currentPassenger: Passenger | null;
  currentRide: CurrentRide | null;
  gamePhase: 'waiting' | 'rideRequest' | 'driving' | 'interaction' | 'gameOver' | 'success';
  usedPassengers: number[];
  shiftStartTime: number | null;
  sessionStartTime: number;
  currentDialogue?: Dialogue;
  currentDrivingPhase?: 'pickup' | 'destination';
  currentLocation?: Location;
  difficultyLevel?: number;
  gameOverReason?: string;
  survivalBonus?: number;
  showSaveNotification?: boolean;
  completedRides?: CompletedRide[];
  revealedHiddenRules?: Rule[];
  showBackstoryNotification?: BackstoryNotification;
  passengerBackstories?: Record<number, boolean>;
  relationshipTriggered?: number | null;
  ruleConflicts?: RuleConflict[];
  // New gameplay enhancement properties
  passengerReputation: Record<number, PassengerReputation>;
  minimumEarnings: number;
  routeHistory: RouteChoice[];
  // Weather and environmental properties
  currentWeather: WeatherCondition;
  timeOfDay: TimeOfDay;
  season: Season;
  environmentalHazards: EnvironmentalHazard[];
  weatherEffects: WeatherEffect[];
}

export interface InventoryItem {
  id: string;
  name: string;
  source: string;
  backstoryItem: boolean;
  type: 'protective' | 'cursed' | 'consumable' | 'tradeable' | 'story';
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  description: string;
  effects?: ItemEffect[];
  durability?: number;
  maxDurability?: number;
  acquiredAt: number;
  canUse: boolean;
  canTrade: boolean;
  cursedProperties?: CursedProperties;
  protectiveProperties?: ProtectiveProperties;
}

export interface ItemEffect {
  type: 'fuel_bonus' | 'time_bonus' | 'rule_immunity' | 'supernatural_protection' | 
        'fuel_drain' | 'time_penalty' | 'rule_trigger' | 'reputation_modifier';
  value: number;
  duration?: number; // in minutes, 0 = permanent while held
  condition?: string; // when this effect applies
}

export interface CursedProperties {
  penaltyType: 'fuel_drain' | 'time_acceleration' | 'forced_choices' | 'attracting_danger';
  penaltyValue: number;
  triggersAfter: number; // minutes of possession
  canBeRemoved: boolean;
  removalCondition?: string;
}

export interface ProtectiveProperties {
  protectionType: 'supernatural_immunity' | 'rule_forgiveness' | 'safe_passage' | 'lucky_encounters';
  protectionStrength: number;
  usesRemaining?: number;
  protectsAgainst?: string[]; // specific passenger IDs or rule IDs
}

export interface WeatherCondition {
  type: 'clear' | 'rain' | 'fog' | 'snow' | 'thunderstorm' | 'wind';
  intensity: 'light' | 'moderate' | 'heavy';
  visibility: number; // 0-100, affects driving
  description: string;
  icon: string;
  effects: WeatherEffect[];
  duration: number; // minutes
  startTime: number; // timestamp
}

export interface TimeOfDay {
  phase: 'dawn' | 'morning' | 'afternoon' | 'dusk' | 'night' | 'latenight';
  hour: number; // 0-23
  description: string;
  ambientLight: number; // 0-100
  supernaturalActivity: number; // 0-100
}

export interface Season {
  type: 'spring' | 'summer' | 'fall' | 'winter';
  month: number; // 1-12
  temperature: 'cold' | 'cool' | 'mild' | 'warm' | 'hot';
  description: string;
  passengerModifiers: {
    spawnRates: Record<string, number>; // passenger type -> modifier
    behaviorChanges: Record<number, string>; // passenger ID -> behavior description
  };
}

export interface WeatherEffect {
  type: 'visibility_reduction' | 'fuel_consumption' | 'time_delay' | 'supernatural_attraction' | 
        'passenger_behavior' | 'route_blockage' | 'rule_modification';
  value: number;
  description: string;
  appliesTo?: string; // specific context where effect applies
}

export interface EnvironmentalHazard {
  id: string;
  type: 'construction' | 'accident' | 'supernatural_event' | 'road_closure' | 'police_checkpoint';
  location: string;
  severity: 'minor' | 'major' | 'extreme';
  description: string;
  effects: {
    routeBlocked?: string[]; // route types that are blocked
    timeDelay?: number;
    fuelIncrease?: number;
    riskIncrease?: number;
    forcedChoice?: boolean;
  };
  duration: number; // minutes
  startTime: number; // timestamp
  weatherTriggered?: boolean;
}

export interface CompletedRide {
  passenger: Passenger;
  duration: number;
  timestamp: number;
}

export interface BackstoryNotification {
  passenger: string;
  backstory: string;
}

export interface PlayerStats {
  totalShiftsCompleted: number;
  totalShiftsStarted: number;
  totalRidesCompleted: number;
  totalEarnings: number;
  totalFuelUsed: number;
  totalTimePlayedMinutes: number;
  bestShiftEarnings: number;
  bestShiftRides: number;
  longestShiftMinutes: number;
  passengersEncountered: Set<number>;
  rulesViolatedHistory: Rule[];
  backstoriesUnlocked: Set<number>;
  legendaryPassengersEncountered: Set<number>;
  achievementsUnlocked: Set<string>;
  firstPlayDate: number;
  lastPlayDate: number;
}

export interface LeaderboardEntry {
  score: number;
  timeRemaining: number;
  date: string;
  survived: boolean;
  passengersTransported: number;
  difficultyLevel: number;
  rulesViolated: number;
}

export interface SaveData {
  gameState: GameState;
  playerStats: PlayerStats;
  timestamp: number;
  version: string;
}

export interface GameData {
  shift_rules: Rule[];
  passengers: Passenger[];
  locations: Location[];
}

export interface RuleConflict {
  rule1: Rule;
  rule2: Rule;
  conflictType: 'direct' | 'indirect' | 'conditional';
  description: string;
}

export interface CurrentRide {
  passenger: Passenger;
  pickupLocation: Location;
  destinationLocation: Location;
  startTime: number;
  estimatedDuration: number;
  actualFare: number;
  routeType: 'normal' | 'shortcut' | 'scenic' | 'police';
}

export interface Dialogue {
  text: string;
  speaker: 'passenger' | 'driver' | 'system';
  timestamp: number;
  type: 'normal' | 'supernatural' | 'rule_related' | 'backstory';
}

export interface GameEngineResult {
  visibleRules: Rule[];
  hiddenRules: Rule[];
  conflicts?: RuleConflict[];
  difficultyLevel: number;
}

export interface HiddenRuleViolation {
  rule: Rule;
}

export interface PassengerReputation {
  interactions: number;
  positiveChoices: number;
  negativeChoices: number;
  lastEncounter: number;
  relationshipLevel: 'hostile' | 'neutral' | 'friendly' | 'trusted';
  specialUnlocks?: string[];
}

export interface RouteChoice {
  choice: 'normal' | 'shortcut' | 'scenic' | 'police';
  phase: 'pickup' | 'destination';
  fuelCost: number;
  timeCost: number;
  riskLevel: number;
  passenger?: number;
  timestamp: number;
}