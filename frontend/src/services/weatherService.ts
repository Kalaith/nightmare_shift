import type { 
  WeatherCondition, 
  TimeOfDay, 
  Season, 
  EnvironmentalHazard, 
  WeatherEffect,
  GameState 
} from '../types/game';
import { GAME_BALANCE } from '../constants/gameBalance';
import { ErrorHandling, type GameResult } from '../utils/errorHandling';

export class WeatherService {
  /**
   * Generate initial weather conditions for a shift
   */
  static generateInitialWeather(season: Season): GameResult<WeatherCondition> {
    return ErrorHandling.wrap(
      () => {
        const weatherTypes = this.getSeasonalWeatherTypes(season);
        const randomType = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
        
        return this.createWeatherCondition(randomType, season);
      },
      'weather_generation_failed',
      this.createDefaultWeather()
    );
  }

  /**
   * Update time of day based on elapsed shift time
   */
  static updateTimeOfDay(shiftStartTime: number, currentTime: number): TimeOfDay {
    const elapsedHours = (currentTime - shiftStartTime) / (1000 * 60 * 60);
    const startHour = 18; // Shift starts at 6 PM
    const currentHour = (startHour + elapsedHours) % 24;
    
    return this.getTimeOfDayFromHour(Math.floor(currentHour));
  }

  /**
   * Get current season based on date
   */
  static getCurrentSeason(): Season {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    
    let seasonType: Season['type'];
    let temperature: Season['temperature'];
    
    if (month >= 3 && month <= 5) {
      seasonType = 'spring';
      temperature = month === 3 ? 'cool' : month === 4 ? 'mild' : 'warm';
    } else if (month >= 6 && month <= 8) {
      seasonType = 'summer';
      temperature = month === 6 ? 'warm' : 'hot';
    } else if (month >= 9 && month <= 11) {
      seasonType = 'fall';
      temperature = month === 9 ? 'warm' : month === 10 ? 'cool' : 'cold';
    } else {
      seasonType = 'winter';
      temperature = 'cold';
    }

    return {
      type: seasonType,
      month,
      temperature,
      description: this.getSeasonDescription(seasonType, temperature),
      passengerModifiers: this.getSeasonalPassengerModifiers(seasonType)
    };
  }

  /**
   * Generate random environmental hazards
   */
  static generateEnvironmentalHazards(
    weather: WeatherCondition, 
    timeOfDay: TimeOfDay,
    season: Season
  ): GameResult<EnvironmentalHazard[]> {
    return ErrorHandling.wrap(
      () => {
        const hazards: EnvironmentalHazard[] = [];
        const hazardChance = this.calculateHazardChance(weather, timeOfDay, season);
        
        if (Math.random() < hazardChance) {
          const hazardType = this.selectHazardType(weather, timeOfDay);
          const hazard = this.createEnvironmentalHazard(hazardType, weather, timeOfDay);
          hazards.push(hazard);
        }
        
        // Weather-triggered hazards
        if (weather.intensity === 'heavy') {
          if (weather.type === 'rain' && Math.random() < 0.4) {
            hazards.push(this.createWeatherHazard('flooding', weather));
          } else if (weather.type === 'snow' && Math.random() < 0.5) {
            hazards.push(this.createWeatherHazard('ice_roads', weather));
          } else if (weather.type === 'fog' && Math.random() < 0.3) {
            hazards.push(this.createWeatherHazard('visibility', weather));
          }
        }
        
        return hazards;
      },
      'hazard_generation_failed',
      []
    );
  }

  /**
   * Apply weather effects to route costs
   */
  static applyWeatherEffects(
    baseFuel: number,
    baseTime: number,
    baseRisk: number,
    weather: WeatherCondition,
    timeOfDay: TimeOfDay
  ): { fuel: number; time: number; risk: number } {
    let fuelModifier = 1;
    let timeModifier = 1;
    let riskModifier = 1;

    // Weather effects
    for (const effect of weather.effects) {
      switch (effect.type) {
        case 'fuel_consumption':
          fuelModifier += effect.value / 100;
          break;
        case 'time_delay':
          timeModifier += effect.value / 100;
          break;
        case 'visibility_reduction':
          riskModifier += effect.value / 100;
          break;
      }
    }

    // Time of day effects
    if (timeOfDay.phase === 'night' || timeOfDay.phase === 'latenight') {
      riskModifier += 0.2; // 20% more risky at night
    }
    
    if (timeOfDay.ambientLight < 30) {
      fuelModifier += 0.1; // Need headlights, use more fuel
    }

    return {
      fuel: Math.round(baseFuel * fuelModifier),
      time: Math.round(baseTime * timeModifier),
      risk: Math.min(5, Math.round(baseRisk * riskModifier))
    };
  }

  /**
   * Check if weather conditions trigger specific rules
   */
  static getWeatherTriggeredRules(weather: WeatherCondition, timeOfDay: TimeOfDay): number[] {
    const triggeredRules: number[] = [];

    // Weather-specific rule triggers
    if (weather.type === 'thunderstorm') {
      triggeredRules.push(101); // Don't use windshield wipers during thunderstorms
    }
    
    if (weather.type === 'fog' && weather.intensity === 'heavy') {
      triggeredRules.push(102); // Keep headlights on during heavy fog
    }
    
    if (weather.type === 'snow') {
      triggeredRules.push(103); // Drive under 25 mph in snow
    }
    
    if (timeOfDay.phase === 'latenight' && weather.type !== 'clear') {
      triggeredRules.push(104); // No stops during late night bad weather
    }

    return triggeredRules;
  }

  /**
   * Update weather conditions over time
   */
  static updateWeather(
    currentWeather: WeatherCondition, 
    gameTime: number,
    season: Season
  ): GameResult<WeatherCondition> {
    return ErrorHandling.wrap(
      () => {
        const elapsed = gameTime - currentWeather.startTime;
        
        // If weather duration has passed, generate new weather
        if (elapsed >= currentWeather.duration * 60000) { // Convert minutes to ms
          const changeChance = 0.3; // 30% chance weather changes
          
          if (Math.random() < changeChance) {
            const newWeatherResult = this.generateInitialWeather(season);
            if (newWeatherResult.success) {
              return newWeatherResult.data;
            }
          }
        }
        
        // Weather intensifies or weakens over time
        if (Math.random() < 0.1) { // 10% chance of intensity change
          const newIntensity = this.getRandomIntensity(currentWeather.type);
          if (newIntensity !== currentWeather.intensity) {
            return {
              ...currentWeather,
              intensity: newIntensity,
              effects: this.getWeatherEffects(currentWeather.type, newIntensity),
              description: this.getWeatherDescription(currentWeather.type, newIntensity)
            };
          }
        }
        
        return currentWeather;
      },
      'weather_update_failed',
      currentWeather
    );
  }

  // Private helper methods
  private static getSeasonalWeatherTypes(season: Season): WeatherCondition['type'][] {
    switch (season.type) {
      case 'spring':
        return ['clear', 'rain', 'thunderstorm', 'wind'];
      case 'summer':
        return ['clear', 'thunderstorm', 'wind'];
      case 'fall':
        return ['clear', 'rain', 'fog', 'wind'];
      case 'winter':
        return ['clear', 'snow', 'fog', 'wind'];
    }
  }

  private static createWeatherCondition(
    type: WeatherCondition['type'], 
    season: Season
  ): WeatherCondition {
    const intensity = this.getRandomIntensity(type);
    const effects = this.getWeatherEffects(type, intensity);
    
    return {
      type,
      intensity,
      visibility: this.calculateVisibility(type, intensity),
      description: this.getWeatherDescription(type, intensity),
      icon: this.getWeatherIcon(type, intensity),
      effects,
      duration: this.getWeatherDuration(type, intensity, season),
      startTime: Date.now()
    };
  }

  private static getRandomIntensity(type: WeatherCondition['type']): WeatherCondition['intensity'] {
    if (type === 'clear') return 'light';
    
    const rand = Math.random();
    if (rand < 0.5) return 'light';
    if (rand < 0.8) return 'moderate';
    return 'heavy';
  }

  private static getWeatherEffects(
    type: WeatherCondition['type'], 
    intensity: WeatherCondition['intensity']
  ): WeatherEffect[] {
    const effects: WeatherEffect[] = [];
    const intensityMultiplier = intensity === 'light' ? 1 : intensity === 'moderate' ? 1.5 : 2;

    switch (type) {
      case 'rain':
        effects.push(
          { type: 'visibility_reduction', value: 10 * intensityMultiplier, description: 'Reduced visibility' },
          { type: 'fuel_consumption', value: 5 * intensityMultiplier, description: 'Increased fuel use' }
        );
        break;
      case 'fog':
        effects.push(
          { type: 'visibility_reduction', value: 20 * intensityMultiplier, description: 'Poor visibility' },
          { type: 'time_delay', value: 15 * intensityMultiplier, description: 'Slower driving' }
        );
        break;
      case 'snow':
        effects.push(
          { type: 'visibility_reduction', value: 15 * intensityMultiplier, description: 'Snow obscures view' },
          { type: 'fuel_consumption', value: 10 * intensityMultiplier, description: 'Cold weather fuel usage' },
          { type: 'time_delay', value: 20 * intensityMultiplier, description: 'Careful driving required' }
        );
        break;
      case 'thunderstorm':
        effects.push(
          { type: 'visibility_reduction', value: 25 * intensityMultiplier, description: 'Heavy rain and darkness' },
          { type: 'supernatural_attraction', value: 30 * intensityMultiplier, description: 'Supernatural activity increases' },
          { type: 'passenger_behavior', value: 20 * intensityMultiplier, description: 'Passengers more agitated' }
        );
        break;
      case 'wind':
        effects.push(
          { type: 'fuel_consumption', value: 8 * intensityMultiplier, description: 'Fighting headwinds' }
        );
        if (intensity === 'heavy') {
          effects.push({ type: 'route_blockage', value: 20, description: 'Some routes blocked by debris' });
        }
        break;
    }

    return effects;
  }

  private static calculateVisibility(
    type: WeatherCondition['type'], 
    intensity: WeatherCondition['intensity']
  ): number {
    let baseVisibility = 100;
    
    switch (type) {
      case 'fog':
        baseVisibility = intensity === 'light' ? 60 : intensity === 'moderate' ? 30 : 10;
        break;
      case 'rain':
      case 'thunderstorm':
        baseVisibility = intensity === 'light' ? 80 : intensity === 'moderate' ? 60 : 40;
        break;
      case 'snow':
        baseVisibility = intensity === 'light' ? 70 : intensity === 'moderate' ? 50 : 25;
        break;
      default:
        baseVisibility = 100;
    }
    
    return Math.max(5, baseVisibility); // Minimum 5% visibility
  }

  private static getWeatherDescription(
    type: WeatherCondition['type'], 
    intensity: WeatherCondition['intensity']
  ): string {
    const descriptions = {
      clear: { light: 'Clear skies with good visibility', moderate: 'Clear skies with good visibility', heavy: 'Clear skies with good visibility' },
      rain: { light: 'Light drizzle dampens the streets', moderate: 'Steady rain creates puddles and reflections', heavy: 'Heavy downpour reduces visibility significantly' },
      fog: { light: 'Thin fog creates an eerie atmosphere', moderate: 'Dense fog obscures distant objects', heavy: 'Thick fog makes driving treacherous' },
      snow: { light: 'Light snowfall dusts the ground', moderate: 'Steady snow accumulates on roads', heavy: 'Heavy snowstorm creates whiteout conditions' },
      thunderstorm: { light: 'Distant thunder rumbles ominously', moderate: 'Lightning illuminates the dark clouds', heavy: 'Violent thunderstorm rages overhead' },
      wind: { light: 'Gentle breeze stirs the air', moderate: 'Strong winds rock the vehicle', heavy: 'Powerful gusts threaten to push cars off course' }
    };
    
    return descriptions[type][intensity];
  }

  private static getWeatherIcon(
    type: WeatherCondition['type'], 
    intensity: WeatherCondition['intensity']
  ): string {
    const icons = {
      clear: '☀️',
      rain: intensity === 'heavy' ? '🌧️' : '🌦️',
      fog: '🌫️',
      snow: intensity === 'heavy' ? '❄️' : '🌨️',
      thunderstorm: '⛈️',
      wind: '💨'
    };
    
    return icons[type];
  }

  private static getWeatherDuration(
    type: WeatherCondition['type'], 
    intensity: WeatherCondition['intensity'],
    season: Season
  ): number {
    // Base duration in minutes
    const baseDuration = {
      clear: 60,
      rain: 30,
      fog: 45,
      snow: 40,
      thunderstorm: 20,
      wind: 35
    };
    
    let duration = baseDuration[type];
    
    // Intensity affects duration
    if (intensity === 'light') duration *= 1.5;
    if (intensity === 'heavy') duration *= 0.7;
    
    // Season affects duration
    if (season.type === 'winter' && (type === 'snow' || type === 'fog')) {
      duration *= 1.3;
    }
    
    return Math.round(duration);
  }

  private static getTimeOfDayFromHour(hour: number): TimeOfDay {
    let phase: TimeOfDay['phase'];
    let description: string;
    let ambientLight: number;
    let supernaturalActivity: number;

    if (hour >= 6 && hour < 8) {
      phase = 'dawn';
      description = 'The sky lightens as dawn approaches';
      ambientLight = 30;
      supernaturalActivity = 70;
    } else if (hour >= 8 && hour < 12) {
      phase = 'morning';
      description = 'Morning light fills the streets';
      ambientLight = 85;
      supernaturalActivity = 20;
    } else if (hour >= 12 && hour < 17) {
      phase = 'afternoon';
      description = 'Bright afternoon sunlight';
      ambientLight = 100;
      supernaturalActivity = 10;
    } else if (hour >= 17 && hour < 20) {
      phase = 'dusk';
      description = 'The sun sets, casting long shadows';
      ambientLight = 40;
      supernaturalActivity = 60;
    } else if (hour >= 20 && hour < 24) {
      phase = 'night';
      description = 'Darkness settles over the city';
      ambientLight = 15;
      supernaturalActivity = 85;
    } else {
      phase = 'latenight';
      description = 'The deepest part of the night';
      ambientLight = 5;
      supernaturalActivity = 100;
    }

    return {
      phase,
      hour,
      description,
      ambientLight,
      supernaturalActivity
    };
  }

  private static getSeasonDescription(
    type: Season['type'], 
    temperature: Season['temperature']
  ): string {
    const descriptions = {
      spring: `Spring weather brings ${temperature} temperatures and frequent changes`,
      summer: `Summer heat creates ${temperature} conditions perfect for night driving`,
      fall: `Autumn's ${temperature} weather brings unpredictable conditions`,
      winter: `Winter's ${temperature} temperatures make every drive challenging`
    };
    
    return descriptions[type];
  }

  private static getSeasonalPassengerModifiers(type: Season['type']): Season['passengerModifiers'] {
    const modifiers = {
      spring: {
        spawnRates: { 'nature_spirits': 1.5, 'lost_souls': 1.2 },
        behaviorChanges: {
          3: 'More active due to spring energy', // Sarah Woods
          8: 'Feels hopeful about new beginnings' // Marcus Thompson
        }
      },
      summer: {
        spawnRates: { 'heat_phantoms': 1.3, 'night_wanderers': 1.4 },
        behaviorChanges: {
          7: 'Nostalgic for summer nights of dancing', // Elena Vasquez
          10: 'Remembers summer fishing trips' // Old Pete
        }
      },
      fall: {
        spawnRates: { 'harvest_spirits': 1.4, 'melancholy_souls': 1.3 },
        behaviorChanges: {
          1: 'More reflective as leaves change', // Mrs. Chen
          12: 'Music feels more haunting in autumn' // Frank the Pianist
        }
      },
      winter: {
        spawnRates: { 'frost_wraiths': 1.5, 'holiday_spirits': 1.2 },
        behaviorChanges: {
          6: 'Misses warm holiday memories', // Tommy Sullivan
          13: 'More protective during cold season' // Sister Agnes
        }
      }
    };
    
    return modifiers[type];
  }

  private static calculateHazardChance(
    weather: WeatherCondition, 
    timeOfDay: TimeOfDay,
    season: Season
  ): number {
    let baseChance = 0.15; // 15% base chance
    
    // Weather increases hazard chance
    if (weather.intensity === 'moderate') baseChance += 0.1;
    if (weather.intensity === 'heavy') baseChance += 0.2;
    
    // Night increases hazard chance
    if (timeOfDay.phase === 'night' || timeOfDay.phase === 'latenight') {
      baseChance += 0.15;
    }
    
    // Winter increases hazard chance
    if (season.type === 'winter') baseChance += 0.1;
    
    return Math.min(0.6, baseChance); // Cap at 60%
  }

  private static selectHazardType(
    weather: WeatherCondition, 
    timeOfDay: TimeOfDay
  ): EnvironmentalHazard['type'] {
    const types: EnvironmentalHazard['type'][] = ['construction', 'accident', 'road_closure'];
    
    // Add weather-specific hazards
    if (weather.type === 'thunderstorm' || timeOfDay.supernaturalActivity > 70) {
      types.push('supernatural_event');
    }
    
    if (timeOfDay.phase === 'night' || timeOfDay.phase === 'latenight') {
      types.push('police_checkpoint');
    }
    
    return types[Math.floor(Math.random() * types.length)];
  }

  private static createEnvironmentalHazard(
    type: EnvironmentalHazard['type'],
    weather: WeatherCondition,
    timeOfDay: TimeOfDay
  ): EnvironmentalHazard {
    const locations = [
      'Downtown Bridge', 'Highway 101', 'Industrial District', 'Cemetery Road',
      'Forest Route', 'Waterfront Drive', 'University Avenue', 'Hospital District'
    ];
    
    const location = locations[Math.floor(Math.random() * locations.length)];
    const severity = Math.random() < 0.1 ? 'extreme' : Math.random() < 0.3 ? 'major' : 'minor';
    
    return {
      id: `${type}_${Date.now()}_${Math.random()}`,
      type,
      location,
      severity,
      description: this.getHazardDescription(type, severity, location),
      effects: this.getHazardEffects(type, severity),
      duration: this.getHazardDuration(type, severity),
      startTime: Date.now(),
      weatherTriggered: weather.intensity === 'heavy'
    };
  }

  private static createWeatherHazard(
    hazardType: string, 
    weather: WeatherCondition
  ): EnvironmentalHazard {
    const hazardMap = {
      flooding: { type: 'road_closure' as const, description: 'Flash flooding blocks roadway' },
      ice_roads: { type: 'accident' as const, description: 'Ice makes roads treacherous' },
      visibility: { type: 'construction' as const, description: 'Poor visibility causes delays' }
    };
    
    const hazardInfo = hazardMap[hazardType as keyof typeof hazardMap];
    
    return {
      id: `weather_${hazardType}_${Date.now()}`,
      type: hazardInfo.type,
      location: 'Weather-affected area',
      severity: weather.intensity === 'heavy' ? 'major' : 'minor',
      description: hazardInfo.description,
      effects: this.getWeatherHazardEffects(hazardType),
      duration: weather.duration * 0.5, // Hazard lasts half as long as weather
      startTime: Date.now(),
      weatherTriggered: true
    };
  }

  private static getHazardDescription(
    type: EnvironmentalHazard['type'], 
    severity: EnvironmentalHazard['severity'],
    location: string
  ): string {
    const descriptions = {
      construction: {
        minor: `Minor road work on ${location}`,
        major: `Major construction project blocks ${location}`,
        extreme: `Emergency road repairs shut down ${location}`
      },
      accident: {
        minor: `Fender-bender causes delays on ${location}`,
        major: `Multi-car accident blocks lanes on ${location}`,
        extreme: `Major crash completely closes ${location}`
      },
      supernatural_event: {
        minor: `Strange lights reported near ${location}`,
        major: `Unexplained phenomena disrupt traffic at ${location}`,
        extreme: `Supernatural event forces evacuation of ${location}`
      },
      road_closure: {
        minor: `Temporary closure of one lane on ${location}`,
        major: `${location} closed for maintenance`,
        extreme: `${location} completely shut down indefinitely`
      },
      police_checkpoint: {
        minor: `Routine checkpoint on ${location}`,
        major: `Extensive police presence at ${location}`,
        extreme: `Roadblock and search operation on ${location}`
      }
    };
    
    return descriptions[type][severity];
  }

  private static getHazardEffects(
    type: EnvironmentalHazard['type'], 
    severity: EnvironmentalHazard['severity']
  ): EnvironmentalHazard['effects'] {
    const severityMultiplier = severity === 'minor' ? 1 : severity === 'major' ? 2 : 3;
    
    const baseEffects = {
      construction: { timeDelay: 5, fuelIncrease: 2 },
      accident: { timeDelay: 10, riskIncrease: 1 },
      supernatural_event: { riskIncrease: 2, forcedChoice: true },
      road_closure: { routeBlocked: ['normal', 'shortcut'], timeDelay: 15 },
      police_checkpoint: { timeDelay: 8, riskIncrease: 1 }
    };
    
    const effects = baseEffects[type];

    return {
      routeBlocked: 'routeBlocked' in effects ? effects.routeBlocked : undefined,
      timeDelay: 'timeDelay' in effects && effects.timeDelay ? effects.timeDelay * severityMultiplier : undefined,
      fuelIncrease: 'fuelIncrease' in effects && effects.fuelIncrease ? effects.fuelIncrease * severityMultiplier : undefined,
      riskIncrease: 'riskIncrease' in effects && effects.riskIncrease ? effects.riskIncrease * severityMultiplier : undefined,
      forcedChoice: 'forcedChoice' in effects ? effects.forcedChoice : undefined
    };
  }

  private static getWeatherHazardEffects(hazardType: string): EnvironmentalHazard['effects'] {
    const effects = {
      flooding: { routeBlocked: ['normal', 'shortcut'], timeDelay: 20, riskIncrease: 2 },
      ice_roads: { timeDelay: 15, riskIncrease: 3, forcedChoice: true },
      visibility: { timeDelay: 10, riskIncrease: 1 }
    };
    
    return effects[hazardType as keyof typeof effects];
  }

  private static getHazardDuration(
    type: EnvironmentalHazard['type'], 
    severity: EnvironmentalHazard['severity']
  ): number {
    const baseDuration = {
      construction: 45,
      accident: 25,
      supernatural_event: 15,
      road_closure: 60,
      police_checkpoint: 20
    };
    
    const severityMultiplier = severity === 'minor' ? 0.7 : severity === 'major' ? 1 : 1.5;
    
    return Math.round(baseDuration[type] * severityMultiplier);
  }

  private static createDefaultWeather(): WeatherCondition {
    return {
      type: 'clear',
      intensity: 'light',
      visibility: 100,
      description: 'Clear night skies',
      icon: '🌙',
      effects: [],
      duration: 60,
      startTime: Date.now()
    };
  }
}