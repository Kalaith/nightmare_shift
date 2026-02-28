import { useState, useCallback, useEffect } from 'react';
import type { PlayerStats, LeaderboardEntry } from '../types/game';
import { gameApi } from '../api/gameApi';

/**
 * Default player stats — used for initialization before backend responds.
 */
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
  almanacProgress: {},
});

export const usePlayerStats = () => {
  const [playerStats, setPlayerStats] = useState<PlayerStats>(getDefaultPlayerStats);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  /**
   * Fetch player stats from backend on mount.
   */
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await gameApi.getStats();
        if (stats) {
          // Merge backend stats with defaults to ensure Set fields are initialized
          setPlayerStats(prev => ({
            ...getDefaultPlayerStats(),
            ...prev,
            ...stats,
          }));
        }
      } catch (err) {
        console.warn('Failed to fetch player stats from backend, using defaults:', err);
      }
    };
    fetchStats();
  }, []);

  /**
   * Update player stats locally — stats are persisted to the backend
   * automatically during game actions (start shift, end shift, etc.).
   */
  const updatePlayerStats = useCallback(
    (updates: Partial<PlayerStats> | ((prev: PlayerStats) => Partial<PlayerStats>)) => {
      setPlayerStats(prev => {
        const derivedUpdates = typeof updates === 'function' ? updates(prev) : updates;
        if (Object.keys(derivedUpdates).length === 0) return prev;

        return {
          ...prev,
          ...derivedUpdates,
          lastPlayDate: Date.now(),
        };
      });
    },
    []
  );

  /**
   * Add to leaderboard — backend handles persistence.
   * This is called by endShift action which already posts to backend.
   */
  const addToLeaderboard = useCallback((entry: {
    earnings: number;
    ridesCompleted: number;
    timeSpent: number;
    survived: boolean;
    rulesViolated: number;
    passengersEncountered: number;
    difficultyLevel: number;
  }) => {
    // Leaderboard is written by the backend endShift action
    // Just refresh the local leaderboard cache
    refreshLeaderboard();
  }, []);

  /**
   * Refresh leaderboard from backend.
   */
  const refreshLeaderboard = useCallback(async () => {
    try {
      const entries = await gameApi.getLeaderboard(10);
      setLeaderboard(entries);
    } catch (err) {
      console.warn('Failed to fetch leaderboard:', err);
    }
  }, []);

  // Almanac functions
  const trackPassengerEncounter = useCallback(
    (passengerId: number) => {
      updatePlayerStats(prev => {
        const currentProgress = prev.almanacProgress[passengerId] || {
          passengerId,
          encountered: false,
          knowledgeLevel: 0,
          unlockedSecrets: [],
        };

        if (currentProgress.encountered) return {};

        return {
          almanacProgress: {
            ...prev.almanacProgress,
            [passengerId]: {
              ...currentProgress,
              encountered: true,
              knowledgeLevel: 1,
            },
          },
        };
      });
    },
    [updatePlayerStats]
  );

  const upgradeKnowledge = useCallback(
    (passengerId: number) => {
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
                knowledgeLevel: (currentProgress.knowledgeLevel + 1) as 0 | 1 | 2 | 3,
              },
            },
          };
        }
        return {};
      });
    },
    [updatePlayerStats]
  );

  const awardLoreFragments = useCallback(
    (amount: number) => {
      updatePlayerStats(prev => ({
        loreFragments: prev.loreFragments + amount,
      }));
    },
    [updatePlayerStats]
  );

  const purchaseSkill = useCallback(
    (skillId: string) => {
      import('../data/skillTreeData').then(({ SKILL_TREE }) => {
        updatePlayerStats(prev => {
          if (prev.unlockedSkills.includes(skillId)) return {};

          const skill = SKILL_TREE.find(s => s.id === skillId);
          if (!skill) return {};

          const hasPrereqs = skill.prerequisites.every(prereqId =>
            prev.unlockedSkills.includes(prereqId)
          );

          if (hasPrereqs && prev.bankBalance >= skill.cost) {
            return {
              bankBalance: prev.bankBalance - skill.cost,
              unlockedSkills: [...prev.unlockedSkills, skillId],
            };
          }
          return {};
        });
      });
    },
    [updatePlayerStats]
  );

  const addToBankBalance = useCallback(
    (amount: number) => {
      updatePlayerStats(prev => ({
        bankBalance: prev.bankBalance + amount,
      }));
    },
    [updatePlayerStats]
  );

  return {
    playerStats,
    updatePlayerStats,
    addToLeaderboard,
    leaderboard,
    refreshLeaderboard,
    trackPassengerEncounter,
    upgradeKnowledge,
    awardLoreFragments,
    purchaseSkill,
    addToBankBalance,
  };
};
