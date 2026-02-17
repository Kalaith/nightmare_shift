import { createContext } from 'react';
import type { PlayerStats } from '../types/game';

export interface PlayerContextType {
  playerStats: PlayerStats;
  updatePlayerStats: (
    updates: Partial<PlayerStats> | ((prev: PlayerStats) => Partial<PlayerStats>)
  ) => void;
  addToLeaderboard: (entry: {
    earnings: number;
    ridesCompleted: number;
    timeSpent: number;
    survived: boolean;
    rulesViolated: number;
    passengersEncountered: number;
    difficultyLevel: number;
  }) => void;
  trackPassengerEncounter: (passengerId: number) => void;
  upgradeKnowledge: (passengerId: number) => void;
  awardLoreFragments: (amount: number) => void;
  purchaseSkill: (skillId: string) => void;
  addToBankBalance: (amount: number) => void;
}

export const PlayerContext = createContext<PlayerContextType | undefined>(undefined);
