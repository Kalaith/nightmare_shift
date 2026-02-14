// Environment related types

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
  type:
    | 'visibility_reduction'
    | 'fuel_consumption'
    | 'time_delay'
    | 'supernatural_attraction'
    | 'passenger_behavior'
    | 'route_blockage'
    | 'rule_modification';
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
