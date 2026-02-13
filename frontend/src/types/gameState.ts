// Game state and core types
import type {
  Rule,
  Guideline,
  PassengerNeedState,
  RuleConflict,
  GuidelineDecision,
  DetectedTell,
  GuidelineException,
} from "./rules";
import type { Passenger, RouteChoice, PassengerReputation } from "./passenger";
import type {
  WeatherCondition,
  TimeOfDay,
  Season,
  EnvironmentalHazard,
  WeatherEffect,
} from "./environment";
import type { Location } from "./location";
import type { InventoryItem } from "./inventory";

export interface GameState {
  currentScreen: string;
  fuel: number;
  earnings: number;
  timeRemaining: number;
  ridesCompleted: number;
  rulesViolated: number;
  currentRules: Rule[];
  currentGuidelines?: Guideline[];
  hiddenRules?: Rule[];
  inventory: InventoryItem[];
  currentPassenger: Passenger | null;
  currentRide: CurrentRide | null;
  gamePhase:
    | "waiting"
    | "rideRequest"
    | "driving"
    | "interaction"
    | "dropOff"
    | "gameOver"
    | "success";
  usedPassengers: number[];
  shiftStartTime: number | null;
  sessionStartTime: number;
  currentDialogue?: Dialogue;
  currentDrivingPhase?: "pickup" | "destination";
  currentLocation?: Location;
  lastRideCompletion?: {
    passenger: Passenger;
    fareEarned: number;
    itemsReceived: InventoryItem[];
    backstoryUnlocked?: {
      passenger: string;
      backstory: string;
    };
  };
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
  // Guideline system properties
  activeExceptions?: GuidelineException[];
  // Route mastery and consequence tracking
  routeMastery?: Record<string, number>; // Track uses of each route type
  routeConsequences?: string[]; // Active route-based consequences
  consecutiveRouteStreak?: { type: string; count: number }; // Track route patterns
  pendingRouteDialogue?: string | null; // Dialogue triggered by route choice
  detectedTells?: DetectedTell[];
  playerTrust?: number; // 0-1, player's accumulated trust level
  decisionHistory?: GuidelineDecision[];
  ruleConfidence: number;
  currentPassengerNeedState?: PassengerNeedState | null;
}

export interface CurrentRide {
  passenger: Passenger;
  pickupLocation: Location;
  destinationLocation: Location;
  startTime: number;
  estimatedDuration: number;
  actualFare: number;
  routeType: "normal" | "shortcut" | "scenic" | "police";
}

export interface Dialogue {
  text: string;
  speaker: "passenger" | "driver" | "system";
  timestamp: number;
  type: "normal" | "supernatural" | "rule_related" | "backstory";
}

export interface GameEngineResult {
  visibleRules: Rule[];
  hiddenRules: Rule[];
  conflicts?: RuleConflict[];
  difficultyLevel: number;
  guidelines?: Guideline[];
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
