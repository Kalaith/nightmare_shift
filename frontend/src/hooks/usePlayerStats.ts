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

const parseBackendDate = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return Date.now();
};

const normalizePlayerStats = (stats: Record<string, unknown>): PlayerStats => ({
  ...getDefaultPlayerStats(),
  totalShiftsCompleted: Number(stats.totalShiftsCompleted ?? stats.total_shifts_completed ?? 0),
  totalShiftsStarted: Number(stats.totalShiftsStarted ?? stats.total_shifts_started ?? 0),
  totalRidesCompleted: Number(stats.totalRidesCompleted ?? stats.total_rides_completed ?? 0),
  totalEarnings: Number(stats.totalEarnings ?? stats.total_earnings ?? 0),
  totalFuelUsed: Number(stats.totalFuelUsed ?? stats.total_fuel_used ?? 0),
  totalTimePlayedMinutes: Number(stats.totalTimePlayedMinutes ?? stats.total_time_played_minutes ?? 0),
  bestShiftEarnings: Number(stats.bestShiftEarnings ?? stats.best_shift_earnings ?? 0),
  bestShiftRides: Number(stats.bestShiftRides ?? stats.best_shift_rides ?? 0),
  longestShiftMinutes: Number(stats.longestShiftMinutes ?? stats.longest_shift_minutes ?? 0),
  bankBalance: Number(stats.bankBalance ?? stats.bank_balance ?? 0),
  loreFragments: Number(stats.loreFragments ?? stats.lore_fragments ?? 0),
  unlockedSkills: Array.isArray(stats.unlockedSkills ?? stats.unlocked_skills)
    ? ((stats.unlockedSkills ?? stats.unlocked_skills) as string[])
    : [],
  passengersEncountered: new Set(
    Array.isArray(stats.passengersEncountered ?? stats.passengers_encountered)
      ? ((stats.passengersEncountered ?? stats.passengers_encountered) as number[]).map(Number)
      : []
  ),
  backstoriesUnlocked: new Set(
    Array.isArray(stats.backstoriesUnlocked ?? stats.backstories_unlocked)
      ? ((stats.backstoriesUnlocked ?? stats.backstories_unlocked) as number[]).map(Number)
      : []
  ),
  legendaryPassengersEncountered: new Set(
    Array.isArray(stats.legendaryPassengersEncountered ?? stats.legendary_passengers)
      ? ((stats.legendaryPassengersEncountered ?? stats.legendary_passengers) as number[]).map(Number)
      : []
  ),
  achievementsUnlocked: new Set(
    Array.isArray(stats.achievementsUnlocked ?? stats.achievements_unlocked)
      ? ((stats.achievementsUnlocked ?? stats.achievements_unlocked) as string[])
      : []
  ),
  rulesViolatedHistory: Array.isArray(stats.rulesViolatedHistory ?? stats.rules_violated_history)
    ? ((stats.rulesViolatedHistory ?? stats.rules_violated_history) as PlayerStats['rulesViolatedHistory'])
    : [],
  firstPlayDate: parseBackendDate(stats.firstPlayDate ?? stats.first_play_date),
  lastPlayDate: parseBackendDate(stats.lastPlayDate ?? stats.last_play_date),
  almanacProgress:
    (stats.almanacProgress as Record<number, PlayerStats['almanacProgress'][number]>) ??
    (stats.almanac_progress as Record<number, PlayerStats['almanacProgress'][number]>) ??
    {},
});

export const usePlayerStats = (authUserId: number | null) => {
  const [playerStats, setPlayerStats] = useState<PlayerStats>(getDefaultPlayerStats);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const refreshStats = useCallback(async () => {
    if (authUserId === null) {
      setPlayerStats(getDefaultPlayerStats());
      return;
    }

    try {
      const [stats, almanac] = await Promise.all([gameApi.getStats(), gameApi.getAlmanac()]);
      if (stats) {
        setPlayerStats(prev => ({
          ...prev,
          ...normalizePlayerStats(stats as unknown as Record<string, unknown>),
          almanacProgress: (almanac as PlayerStats['almanacProgress']) ?? {},
        }));
      }
    } catch (err) {
      console.warn('Failed to fetch player stats from backend, using defaults:', err);
    }
  }, [authUserId]);

  /**
   * Fetch player stats from backend on mount.
   */
  useEffect(() => {
    void refreshStats();
  }, [refreshStats]);

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
    async (passengerId: number) => {
      try {
        const stats = await gameApi.upgradeAlmanac(passengerId);
        setPlayerStats(prev => ({
          ...prev,
          ...normalizePlayerStats(stats as unknown as Record<string, unknown>),
        }));
        await refreshStats();
      } catch (err) {
        console.warn('Failed to upgrade almanac:', err);
      }
    },
    [refreshStats]
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
    async (skillId: string) => {
      try {
        const stats = await gameApi.purchaseSkill(skillId);
        setPlayerStats(prev => ({
          ...prev,
          ...normalizePlayerStats(stats as unknown as Record<string, unknown>),
        }));
        await refreshStats();
      } catch (err) {
        console.warn('Failed to purchase skill:', err);
      }
    },
    [refreshStats]
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
    refreshStats,
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
