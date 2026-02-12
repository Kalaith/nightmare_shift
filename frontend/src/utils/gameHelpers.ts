import type { PlayerStats, GameState } from '../types/game';

export const calculatePlayerExperience = (playerStats: PlayerStats): number => {
  const rides = playerStats.totalRidesCompleted || 0;
  const shifts = playerStats.totalShiftsCompleted || 0;
  return rides + (shifts * 10);
};

export const calculateDifficultyLevel = (experience: number): number => {
  return Math.min(4, Math.floor(experience / 10));
};

export const calculateGameScore = (gameState: GameState, survived: boolean = false): number => {
  const earnings = gameState.earnings || 0;
  const timeBonus = survived ? (gameState.timeRemaining || 0) * 2 : 0;
  const rideBonus = (gameState.ridesCompleted || 0) * 10;
  const survivalBonus = survived ? 50 : 0;
  const penaltyForViolations = (gameState.rulesViolated || 0) * 10;
  
  return Math.max(0, earnings + timeBonus + rideBonus + survivalBonus - penaltyForViolations);
};

export const getRandomElement = <T>(array: T[]): T | null => {
  if (!Array.isArray(array) || array.length === 0) return null;
  return array[Math.floor(Math.random() * array.length)];
};

export const getWeightedRandomElement = <T extends Record<string, unknown>>(
  items: T[], 
  weightKey: keyof T = 'weight'
): T | null => {
  if (!Array.isArray(items) || items.length === 0) return null;
  
  const totalWeight = items.reduce((sum, item) => sum + (item[weightKey] || 1), 0);
  let random = Math.random() * totalWeight;
  
  for (const item of items) {
    random -= (item[weightKey] || 1);
    if (random <= 0) return item;
  }
  
  return items[items.length - 1];
};

export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const randomInRange = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const hasEnoughTimePassed = (lastTime: number | null, cooldownMinutes: number): boolean => {
  if (!lastTime) return true;
  const now = Date.now();
  const cooldownMs = cooldownMinutes * 60 * 1000;
  return (now - lastTime) >= cooldownMs;
};

export const calculateSuccessRate = (successful: number, total: number): number => {
  if (!total || total === 0) return 0;
  return Math.round((successful / total) * 100);
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const lerp = (start: number, end: number, factor: number): number => {
  return start + (end - start) * clamp(factor, 0, 1);
};

export const debounce = <T extends (...args: unknown[]) => unknown>(func: T, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

export const isDevelopment = (): boolean => {
  return import.meta.env.MODE === 'development';
};

export const safeJsonParse = <T>(jsonString: string, fallback: T): T => {
  try {
    return JSON.parse(jsonString);
  } catch {
    // JSON parse failed, returning fallback
    return fallback;
  }
};
