import { useState } from 'react';
import type { PlayerStats, LeaderboardEntry } from '../types/game';
import { STORAGE_KEYS } from '../data/constants';
import LocalStorage, { PlayerStatsService, LeaderboardService } from '../services/storageService';

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
  lastPlayDate: Date.now()
});

export const usePlayerStats = () => {
  const [playerStats, setPlayerStats] = useState<PlayerStats>(() => 
    LocalStorage.load(STORAGE_KEYS.PLAYER_STATS, getDefaultPlayerStats())
  );

  const updatePlayerStats = (updates: Partial<PlayerStats>) => {
    const newStats = { ...playerStats, ...updates, lastPlayDate: Date.now() };
    setPlayerStats(newStats);
    PlayerStatsService.updateStats(updates);
  };

  const addToLeaderboard = (entry: {
    earnings: number;
    ridesCompleted: number;
    timeSpent: number;
    survived: boolean;
    rulesViolated: number;
    passengersEncountered: number;
    difficultyLevel: number;
  }) => {
    const leaderboardEntry: LeaderboardEntry = {
      score: entry.earnings + (entry.ridesCompleted * 10) - (entry.rulesViolated * 5),
      timeRemaining: 0, // This would need to be calculated from game state
      date: new Date().toLocaleDateString(),
      survived: entry.survived,
      passengersTransported: entry.ridesCompleted,
      difficultyLevel: entry.difficultyLevel,
      rulesViolated: entry.rulesViolated
    };

    LeaderboardService.addScore(leaderboardEntry);
  };

  return {
    playerStats,
    updatePlayerStats,
    addToLeaderboard
  };
};