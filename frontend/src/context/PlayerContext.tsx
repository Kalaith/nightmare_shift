import React, { createContext, useContext, ReactNode } from 'react';
import { usePlayerStats } from '../hooks/usePlayerStats';
import type { PlayerStats } from '../types/game';

interface PlayerContextType {
    playerStats: PlayerStats;
    updatePlayerStats: (updates: Partial<PlayerStats> | ((prev: PlayerStats) => Partial<PlayerStats>)) => void;
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

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const playerStatsLogic = usePlayerStats();

    return (
        <PlayerContext.Provider value={playerStatsLogic}>
            {children}
        </PlayerContext.Provider>
    );
};

export const usePlayerContext = () => {
    const context = useContext(PlayerContext);
    if (context === undefined) {
        throw new Error('usePlayerContext must be used within a PlayerProvider');
    }
    return context;
};
