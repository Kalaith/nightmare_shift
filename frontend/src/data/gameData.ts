import type { GameData } from '../types/gameData';
import type { Passenger } from '../types/passenger';
import type { Location } from '../types/location';
import type { Rule } from '../types/rules';
import { shiftRulesData } from './shiftRulesData';
import { passengerData } from './passengerData';
import { locationData } from './locationData';
import { gameApi } from '../api/gameApi';

// ─── Mutable game data ──────────────────────────────────────────────
// Starts with hardcoded defaults; replaced by API data once loaded.
// All services that import `gameData` will see the updated values
// because they hold a reference to this same object.

export const gameData: GameData = {
  shift_rules: shiftRulesData,
  passengers: passengerData,
  locations: locationData,
};

// Track whether content has been loaded from the API
let _contentLoaded = false;
export const isContentLoaded = () => _contentLoaded;

/**
 * Fetch game content from the backend and replace the hardcoded defaults.
 * Should be called once on app startup (e.g. in the root provider).
 * If any fetch fails, that category silently keeps its hardcoded fallback.
 */
export async function loadGameContent(): Promise<void> {
  const results = await Promise.allSettled([
    gameApi.getPassengers(),
    gameApi.getLocations(),
    gameApi.getRules(),
  ]);

  const [passengersResult, locationsResult, rulesResult] = results;

  if (passengersResult.status === 'fulfilled' && passengersResult.value.length > 0) {
    gameData.passengers = passengersResult.value as Passenger[];
  }

  if (locationsResult.status === 'fulfilled' && locationsResult.value.length > 0) {
    gameData.locations = locationsResult.value as Location[];
  }

  if (rulesResult.status === 'fulfilled' && rulesResult.value.length > 0) {
    gameData.shift_rules = rulesResult.value as Rule[];
  }

  _contentLoaded = true;
}
