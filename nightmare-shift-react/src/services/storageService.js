import { STORAGE_KEYS } from '../data/constants.js';

// Local Storage Utilities
const LocalStorage = {
  save: (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  },

  load: (key, defaultValue = null) => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
      return defaultValue;
    }
  },

  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
  },

  clear: () => {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }
};

// Player Statistics Service
export class PlayerStatsService {
  static getStats() {
    return LocalStorage.load(STORAGE_KEYS.PLAYER_STATS, {
      totalGames: 0,
      totalSurvived: 0,
      bestTime: 0,
      totalEarnings: 0,
      averageEarnings: 0,
      rulesViolated: 0,
      passengersTransported: 0,
      favoritePassenger: null,
      unlocked_backstories: []
    });
  }

  static updateStats(gameResult) {
    const stats = this.getStats();
    
    stats.totalGames++;
    if (gameResult.survived) {
      stats.totalSurvived++;
      stats.bestTime = Math.max(stats.bestTime, gameResult.finalTime);
    }
    
    stats.totalEarnings += gameResult.totalMoney || 0;
    stats.averageEarnings = stats.totalEarnings / stats.totalGames;
    stats.rulesViolated += gameResult.rulesViolated || 0;
    stats.passengersTransported += gameResult.passengersTransported || 0;
    
    LocalStorage.save(STORAGE_KEYS.PLAYER_STATS, stats);
    return stats;
  }
}

// Leaderboard Service
export class LeaderboardService {
  static getLeaderboard() {
    return LocalStorage.load(STORAGE_KEYS.LEADERBOARD, []);
  }

  static addScore(gameResult) {
    const leaderboard = this.getLeaderboard();
    
    const entry = {
      score: gameResult.totalMoney || 0,
      timeRemaining: gameResult.finalTime || 0,
      date: new Date().toLocaleDateString(),
      survived: gameResult.survived || false,
      passengersTransported: gameResult.passengersTransported || 0
    };
    
    leaderboard.push(entry);
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard.splice(10); // Keep only top 10
    
    LocalStorage.save(STORAGE_KEYS.LEADERBOARD, leaderboard);
    return leaderboard;
  }

  static clearLeaderboard() {
    LocalStorage.save(STORAGE_KEYS.LEADERBOARD, []);
  }
}

// Game Save/Load Service
export class SaveGameService {
  static saveGame(gameState) {
    const saveData = {
      ...gameState,
      saveDate: new Date().toISOString()
    };
    LocalStorage.save(STORAGE_KEYS.SAVED_GAME, saveData);
  }

  static loadGame() {
    const saveData = LocalStorage.load(STORAGE_KEYS.SAVED_GAME);
    if (saveData && saveData.saveDate) {
      // Check if save is not too old (optional)
      const saveDate = new Date(saveData.saveDate);
      const now = new Date();
      const hoursDiff = (now - saveDate) / (1000 * 60 * 60);
      
      if (hoursDiff > 24) {
        // Save is older than 24 hours, might want to ignore it
        return null;
      }
    }
    return saveData;
  }

  static clearSave() {
    LocalStorage.remove(STORAGE_KEYS.SAVED_GAME);
  }

  static hasSavedGame() {
    return LocalStorage.load(STORAGE_KEYS.SAVED_GAME) !== null;
  }
}

// Backstory Service
export class BackstoryService {
  static getUnlockedBackstories() {
    return LocalStorage.load(STORAGE_KEYS.UNLOCKED_BACKSTORIES, []);
  }

  static unlockBackstory(passengerId) {
    const unlocked = this.getUnlockedBackstories();
    if (!unlocked.includes(passengerId)) {
      unlocked.push(passengerId);
      LocalStorage.save(STORAGE_KEYS.UNLOCKED_BACKSTORIES, unlocked);
    }
    return unlocked;
  }

  static isBackstoryUnlocked(passengerId) {
    const unlocked = this.getUnlockedBackstories();
    return unlocked.includes(passengerId);
  }
}

export default LocalStorage;