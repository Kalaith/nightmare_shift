import { useState, useCallback } from 'react';
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
  lastPlayDate: Date.now(),
  // Roguelike progression
  bankBalance: 0,
  loreFragments: 0,
  unlockedSkills: [],
  almanacProgress: {}
});

export const usePlayerStats = () => {
  const [playerStats, setPlayerStats] = useState<PlayerStats>(() => {
    const loaded = LocalStorage.load(STORAGE_KEYS.PLAYER_STATS, getDefaultPlayerStats());
    // Merge with defaults to ensure new fields exist in old saves
    return { ...getDefaultPlayerStats(), ...loaded };
  });

  const updatePlayerStats = (updates: Partial<PlayerStats>) => {
    const newStats = { ...playerStats, ...updates, lastPlayDate: Date.now() };
    setPlayerStats(newStats);
    // Save the complete stats, not just updates
    LocalStorage.save(STORAGE_KEYS.PLAYER_STATS, newStats);
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

  // Almanac functions
  const trackPassengerEncounter = useCallback((passengerId: number) => {
    const currentProgress = playerStats.almanacProgress[passengerId] || {
      passengerId,
      encountered: false,
      knowledgeLevel: 0,
      unlockedSecrets: []
    };

    if (!currentProgress.encountered) {
      updatePlayerStats({
        almanacProgress: {
          ...playerStats.almanacProgress,
          [passengerId]: {
            ...currentProgress,
            encountered: true,
            knowledgeLevel: 1 // Auto-upgrade to level 1 on first encounter
          }
        }
      });
    }
  }, [playerStats.almanacProgress, updatePlayerStats]);

  const upgradeKnowledge = useCallback((passengerId: number) => {
    const currentProgress = playerStats.almanacProgress[passengerId];
    if (!currentProgress || currentProgress.knowledgeLevel >= 3) return;

    const costs = { 0: 1, 1: 3, 2: 5 };
    const cost = costs[currentProgress.knowledgeLevel as 0 | 1 | 2] || 0;

    if (playerStats.loreFragments >= cost) {
      updatePlayerStats({
        loreFragments: playerStats.loreFragments - cost,
        almanacProgress: {
          ...playerStats.almanacProgress,
          [passengerId]: {
            ...currentProgress,
            knowledgeLevel: (currentProgress.knowledgeLevel + 1) as 0 | 1 | 2 | 3
          }
        }
      });
    }
  }, [playerStats.almanacProgress, playerStats.loreFragments, updatePlayerStats]);

  const awardLoreFragments = useCallback((amount: number) => {
    updatePlayerStats({
      loreFragments: playerStats.loreFragments + amount
    });
  }, [playerStats.loreFragments, updatePlayerStats]);

  // Skill Tree functions
  const purchaseSkill = useCallback((skillId: string) => {
    if (playerStats.unlockedSkills.includes(skillId)) return;

    // Import skill data to get cost
    import('../data/skillTreeData').then(({ SKILL_TREE }) => {
      const skill = SKILL_TREE.find(s => s.id === skillId);
      if (!skill) return;

      // Check prerequisites
      const hasPrereqs = skill.prerequisites.every(prereqId =>
        playerStats.unlockedSkills.includes(prereqId)
      );

      if (hasPrereqs && playerStats.bankBalance >= skill.cost) {
        updatePlayerStats({
          bankBalance: playerStats.bankBalance - skill.cost,
          unlockedSkills: [...playerStats.unlockedSkills, skillId]
        });
      }
    });
  }, [playerStats.unlockedSkills, playerStats.bankBalance, updatePlayerStats]);

  const addToBankBalance = useCallback((amount: number) => {
    updatePlayerStats({
      bankBalance: playerStats.bankBalance + amount
    });
  }, [playerStats.bankBalance, updatePlayerStats]);

  return {
    playerStats,
    updatePlayerStats,
    addToLeaderboard,
    trackPassengerEncounter,
    upgradeKnowledge,
    awardLoreFragments,
    purchaseSkill,
    addToBankBalance
  };
};