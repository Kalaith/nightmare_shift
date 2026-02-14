import { STORAGE_KEYS } from '../data/constants';
import type { PlayerStats, LeaderboardEntry, SaveData } from '../types/game';

const LocalStorage = {
  save: (key: string, data: unknown): void => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // Silent fail - localStorage may be unavailable
    }
  },

  load: <T>(key: string, defaultValue: T): T => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Silent fail
    }
  },

  clear: (): void => {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch {
      // Silent fail
    }
  },
};

const getDefaultPlayerStats = (): PlayerStats => ({
  totalShiftsCompleted: 0,
  totalShiftsStarted: 0,
  totalRidesCompleted: 0,
  totalEarnings: 0,
  totalFuelUsed: 0,
  totalTimePlayedMinutes: 0,
  bestShiftEarnings: 0,
  bestShiftRides: 0,
  longestShiftMinutes: 0,
  passengersEncountered: new Set(),
  rulesViolatedHistory: [],
  backstoriesUnlocked: new Set(),
  legendaryPassengersEncountered: new Set(),
  achievementsUnlocked: new Set(),
  firstPlayDate: Date.now(),
  lastPlayDate: Date.now(),
  bankBalance: 0,
  loreFragments: 0,
  unlockedSkills: [],
  almanacProgress: {},
});

export class PlayerStatsService {
  static getStats(): PlayerStats {
    return LocalStorage.load(STORAGE_KEYS.PLAYER_STATS, getDefaultPlayerStats());
  }

  static updateStats(updates: Partial<PlayerStats>): void {
    const currentStats = this.getStats();
    const updatedStats = {
      ...currentStats,
      ...updates,
      lastPlayDate: Date.now(),
    };
    LocalStorage.save(STORAGE_KEYS.PLAYER_STATS, updatedStats);
  }

  static resetStats(): void {
    LocalStorage.save(STORAGE_KEYS.PLAYER_STATS, getDefaultPlayerStats());
  }
}

export class LeaderboardService {
  static getLeaderboard(): LeaderboardEntry[] {
    return LocalStorage.load(STORAGE_KEYS.LEADERBOARD, []);
  }

  static addScore(entry: LeaderboardEntry): void {
    const leaderboard = this.getLeaderboard();
    leaderboard.push(entry);
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard.splice(10); // Keep only top 10
    LocalStorage.save(STORAGE_KEYS.LEADERBOARD, leaderboard);
  }

  static clearLeaderboard(): void {
    LocalStorage.save(STORAGE_KEYS.LEADERBOARD, []);
  }
}

export class SaveGameService {
  static saveGame(saveData: SaveData): void {
    LocalStorage.save(STORAGE_KEYS.SAVE_GAME, saveData);
  }

  static loadGame(): SaveData | null {
    return LocalStorage.load<SaveData | null>(STORAGE_KEYS.SAVE_GAME, null);
  }

  static hasSavedGame(): boolean {
    return this.loadGame() !== null;
  }

  static clearSave(): void {
    LocalStorage.remove(STORAGE_KEYS.SAVE_GAME);
  }
}

export class BackstoryService {
  static getUnlockedBackstories(): Set<number> {
    const data = LocalStorage.load(STORAGE_KEYS.BACKSTORY_PROGRESS, []);
    return new Set(data);
  }

  static unlockBackstory(passengerId: number): void {
    const unlocked = this.getUnlockedBackstories();
    unlocked.add(passengerId);
    LocalStorage.save(STORAGE_KEYS.BACKSTORY_PROGRESS, Array.from(unlocked));
  }

  static isBackstoryUnlocked(passengerId: number): boolean {
    return this.getUnlockedBackstories().has(passengerId);
  }
}

export default LocalStorage;
