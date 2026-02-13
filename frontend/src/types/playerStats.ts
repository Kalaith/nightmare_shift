// Player stats and progression types

import type { Rule } from "./rules";

export interface PlayerStats {
  totalShiftsCompleted: number;
  totalShiftsStarted: number;
  totalRidesCompleted: number;
  totalEarnings: number;
  totalFuelUsed: number;
  totalTimePlayedMinutes: number;
  bestShiftEarnings: number;
  bestShiftRides: number;
  longestShiftMinutes: number;
  passengersEncountered: Set<number>;
  rulesViolatedHistory: Rule[];
  backstoriesUnlocked: Set<number>;
  legendaryPassengersEncountered: Set<number>;
  achievementsUnlocked: Set<string>;
  firstPlayDate: number;
  lastPlayDate: number;
  // Roguelike progression
  bankBalance: number;
  loreFragments: number;
  unlockedSkills: string[];
  almanacProgress: Record<number, AlmanacEntry>;
}

export interface AlmanacEntry {
  passengerId: number;
  encountered: boolean;
  knowledgeLevel: 0 | 1 | 2 | 3; // 0=None, 1=Basic, 2=Advanced, 3=Complete
  unlockedSecrets: string[];
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
  category: "survival" | "occult" | "efficiency";
  prerequisites: string[];
  effect: SkillEffect;
}

export interface SkillEffect {
  type: "stat_boost" | "mechanic_unlock" | "passive_bonus";
  target: string;
  value: number;
}

export interface LeaderboardEntry {
  score: number;
  timeRemaining: number;
  date: string;
  survived: boolean;
  passengersTransported: number;
  difficultyLevel: number;
  rulesViolated: number;
}
