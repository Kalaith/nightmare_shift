// Utility functions for game logic and calculations

// Calculate player experience based on stats
export const calculatePlayerExperience = (playerStats) => {
  const rides = playerStats.totalRidesCompleted || 0;
  const shifts = playerStats.totalShiftsCompleted || 0;
  return rides + (shifts * 10);
};

// Calculate difficulty level based on experience
export const calculateDifficultyLevel = (experience) => {
  return Math.min(4, Math.floor(experience / 10));
};

// Calculate final game score
export const calculateGameScore = (gameState, survived = false) => {
  const earnings = gameState.earnings || 0;
  const timeBonus = survived ? (gameState.timeRemaining || 0) * 2 : 0;
  const rideBonus = (gameState.ridesCompleted || 0) * 10;
  const survivalBonus = survived ? 50 : 0;
  const penaltyForViolations = (gameState.rulesViolated || 0) * 10;
  
  return Math.max(0, earnings + timeBonus + rideBonus + survivalBonus - penaltyForViolations);
};

// Check if passenger is supernatural
export const isSupernaturalPassenger = (passenger) => {
  return passenger.supernatural && passenger.supernatural !== "Living person";
};

// Get random element from array
export const getRandomElement = (array) => {
  if (!Array.isArray(array) || array.length === 0) return null;
  return array[Math.floor(Math.random() * array.length)];
};

// Get weighted random element from array
export const getWeightedRandomElement = (items, weightKey = 'weight') => {
  if (!Array.isArray(items) || items.length === 0) return null;
  
  const totalWeight = items.reduce((sum, item) => sum + (item[weightKey] || 1), 0);
  let random = Math.random() * totalWeight;
  
  for (const item of items) {
    random -= (item[weightKey] || 1);
    if (random <= 0) return item;
  }
  
  return items[items.length - 1]; // Fallback
};

// Shuffle array using Fisher-Yates algorithm
export const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Generate random number in range
export const randomInRange = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Check if enough time has passed
export const hasEnoughTimePassed = (lastTime, cooldownMinutes) => {
  if (!lastTime) return true;
  const now = Date.now();
  const cooldownMs = cooldownMinutes * 60 * 1000;
  return (now - lastTime) >= cooldownMs;
};

// Calculate success rate percentage
export const calculateSuccessRate = (successful, total) => {
  if (!total || total === 0) return 0;
  return Math.round((successful / total) * 100);
};

// Generate unique ID for game objects
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Deep clone an object (for game state management)
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof Array) return obj.map(deepClone);
  if (obj instanceof Set) return new Set([...obj].map(deepClone));
  if (obj instanceof Map) return new Map([...obj].map(([k, v]) => [deepClone(k), deepClone(v)]));
  
  const cloned = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
};

// Validate game state structure
export const validateGameState = (gameState) => {
  const requiredFields = [
    'currentScreen',
    'fuel', 
    'earnings',
    'timeRemaining',
    'ridesCompleted',
    'gamePhase'
  ];
  
  for (const field of requiredFields) {
    if (gameState[field] === undefined || gameState[field] === null) {
      return { valid: false, missing: field };
    }
  }
  
  return { valid: true };
};

// Clamp value between min and max
export const clamp = (value, min, max) => {
  return Math.min(Math.max(value, min), max);
};

// Linear interpolation between two values
export const lerp = (start, end, factor) => {
  return start + (end - start) * clamp(factor, 0, 1);
};

// Check if two objects are equal (shallow comparison)
export const isEqual = (obj1, obj2) => {
  if (obj1 === obj2) return true;
  if (!obj1 || !obj2) return false;
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) return false;
  }
  
  return true;
};

// Debounce function for performance optimization
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

// Check if running in development mode
export const isDevelopment = () => {
  return process.env.NODE_ENV === 'development';
};

// Safe JSON parse with fallback
export const safeJsonParse = (jsonString, fallback = null) => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('Failed to parse JSON:', error);
    return fallback;
  }
};