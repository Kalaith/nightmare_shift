import type { PlayerStats, GameState } from '../types/game';

export interface ShiftData {
  timeSpent: number;
  ridesCompleted: number;
  earnings: number;
  rulesViolated: number;
  score: number;
  survived: boolean;
  difficultyLevel: number;
}

export const createStatsUpdater = (
  playerStats: PlayerStats, 
  updatePlayerStats: (updates: Partial<PlayerStats>) => void,
  addToLeaderboard: (data: ShiftData) => void
) => {
  return (successful: boolean, shiftData: ShiftData) => {
    const baseUpdates = {
      totalTimePlayedMinutes: playerStats.totalTimePlayedMinutes + shiftData.timeSpent,
      totalRidesCompleted: playerStats.totalRidesCompleted + shiftData.ridesCompleted,
      totalEarnings: playerStats.totalEarnings + shiftData.earnings
    };

    if (successful) {
      updatePlayerStats({
        ...baseUpdates,
        totalShiftsCompleted: playerStats.totalShiftsCompleted + 1,
        bestShiftEarnings: Math.max(playerStats.bestShiftEarnings, shiftData.earnings),
        bestShiftRides: Math.max(playerStats.bestShiftRides, shiftData.ridesCompleted),
        longestShiftMinutes: Math.max(playerStats.longestShiftMinutes, shiftData.timeSpent)
      });
    } else {
      updatePlayerStats(baseUpdates);
    }

    addToLeaderboard(shiftData);
  };
};