import { useState, useCallback } from 'react';
import type { PlayerStats, LeaderboardEntry } from '../types/game';
import { STORAGE_KEYS } from '../data/constants';
import LocalStorage, { LeaderboardService } from '../services/storageService';

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

  const updatePlayerStats = useCallback((updates: Partial<PlayerStats> | ((prev: PlayerStats) => Partial<PlayerStats>)) => {
    setPlayerStats(prev => {
      const derivedUpdates = typeof updates === 'function' ? updates(prev) : updates;
      // If no updates, return prev to avoid unnecessary re-renders
      if (Object.keys(derivedUpdates).length === 0) return prev;

      const newStats = { ...prev, ...derivedUpdates, lastPlayDate: Date.now() };
      // Save the complete stats, not just updates
      LocalStorage.save(STORAGE_KEYS.PLAYER_STATS, newStats);
      return newStats;
    });
  }, []);

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
    updatePlayerStats(prev => {
      const currentProgress = prev.almanacProgress[passengerId] || {
        passengerId,
        encountered: false,
        knowledgeLevel: 0,
        unlockedSecrets: []
      };

      if (currentProgress.encountered) return {};

      return {
        almanacProgress: {
          ...prev.almanacProgress,
          [passengerId]: {
            ...currentProgress,
            encountered: true,
            knowledgeLevel: 1 // Auto-upgrade to level 1 on first encounter
          }
        }
      };
    });
  }, [updatePlayerStats]);

  const upgradeKnowledge = useCallback((passengerId: number) => {
    updatePlayerStats(prev => {
      const currentProgress = prev.almanacProgress[passengerId];
      if (!currentProgress || currentProgress.knowledgeLevel >= 3) return {};

      const costs = { 0: 1, 1: 3, 2: 5 };
      const cost = costs[currentProgress.knowledgeLevel as 0 | 1 | 2] || 0;

      if (prev.loreFragments >= cost) {
        return {
          loreFragments: prev.loreFragments - cost,
          almanacProgress: {
            ...prev.almanacProgress,
            [passengerId]: {
              ...currentProgress,
              knowledgeLevel: (currentProgress.knowledgeLevel + 1) as 0 | 1 | 2 | 3
            }
          }
        };
      }
      return {};
    });
  }, [updatePlayerStats]);

  const awardLoreFragments = useCallback((amount: number) => {
    updatePlayerStats(prev => ({
      loreFragments: prev.loreFragments + amount
    }));
  }, [updatePlayerStats]);

  // Skill Tree functions
  const purchaseSkill = useCallback((skillId: string) => {
    // Import skill data to get cost
    import('../data/skillTreeData').then(({ SKILL_TREE }) => {
      updatePlayerStats(prev => {
        if (prev.unlockedSkills.includes(skillId)) return {};

        const skill = SKILL_TREE.find(s => s.id === skillId);
        if (!skill) return {};

        // Check prerequisites
        const hasPrereqs = skill.prerequisites.every(prereqId =>
          prev.unlockedSkills.includes(prereqId)
        );

        if (hasPrereqs && prev.bankBalance >= skill.cost) {
          return {
            bankBalance: prev.bankBalance - skill.cost,
            unlockedSkills: [...prev.unlockedSkills, skillId]
          };
        }
        return {};
      });
    });
  }, [updatePlayerStats]);

  const addToBankBalance = useCallback((amount: number) => {
    updatePlayerStats(prev => ({
      bankBalance: prev.bankBalance + amount
    }));
  }, [updatePlayerStats]);

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
