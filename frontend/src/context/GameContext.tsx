import React, { createContext, useContext, ReactNode } from 'react';
import { useGameState } from '../hooks/useGameState';
import { usePlayerContext } from './PlayerContext';
import type { GameState } from '../types/game';
import type { ShiftData } from '../utils/statsHandler';
import { createStatsUpdater } from '../utils/statsHandler';

interface GameContextType {
    gameState: GameState;
    updateGameState: (updater: React.SetStateAction<GameState>) => void;
    showInventory: boolean;
    setShowInventory: (show: boolean) => void;
    showScreen: (screenName: string) => void;
    startGame: () => void;
    startShift: () => void;
    resetGame: () => void;
    saveGame: () => void;
    loadGame: () => void;
    showRideRequest: () => void;
    gameOver: (reason: string) => void;
    endShift: (successful: boolean, overrideReason?: string) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const {
        playerStats,
        updatePlayerStats,
        addToLeaderboard,
        trackPassengerEncounter,
        awardLoreFragments,
        addToBankBalance
    } = usePlayerContext();

    const gameStateLogic = useGameState(playerStats);

    const handleEndShift = (successful: boolean, overrideReason?: string) => {
        const shiftData = gameStateLogic.endShift(successful, overrideReason);
        const updateStats = createStatsUpdater(playerStats, updatePlayerStats, addToLeaderboard);
        updateStats(shiftData.survived, shiftData);

        // Track all passengers encountered during this shift (always, even on failure)
        if (gameStateLogic.gameState.usedPassengers && gameStateLogic.gameState.usedPassengers.length > 0) {
            gameStateLogic.gameState.usedPassengers.forEach((passengerId: number) => {
                trackPassengerEncounter(passengerId);
            });
        }

        // Award progression rewards based on shift outcome
        if (successful) {
            // Full rewards for successful shift
            const backstoriesThisShift = gameStateLogic.gameState.passengerBackstories ? Object.keys(gameStateLogic.gameState.passengerBackstories).length : 0;
            const loreReward = backstoriesThisShift + (gameStateLogic.gameState.difficultyLevel || 1);
            awardLoreFragments(loreReward);

            // Transfer 20% of earnings to permanent bank balance
            const bankTransfer = Math.floor(gameStateLogic.gameState.earnings * 0.2);
            addToBankBalance(bankTransfer);
        } else {
            // Consolation rewards for failed shift (50% of what you would have gotten)
            const backstoriesThisShift = gameStateLogic.gameState.passengerBackstories ? Object.keys(gameStateLogic.gameState.passengerBackstories).length : 0;
            const loreReward = Math.floor((backstoriesThisShift + (gameStateLogic.gameState.difficultyLevel || 1)) / 2);
            if (loreReward > 0) {
                awardLoreFragments(loreReward);
            }

            // Small consolation bank transfer (10% instead of 20%)
            const bankTransfer = Math.floor(gameStateLogic.gameState.earnings * 0.1);
            if (bankTransfer > 0) {
                addToBankBalance(bankTransfer);
            }
        }
    };

    return (
        <GameContext.Provider value={{
            ...gameStateLogic,
            endShift: handleEndShift
        }}>
            {children}
        </GameContext.Provider>
    );
};

export const useGameContext = () => {
    const context = useContext(GameContext);
    if (context === undefined) {
        throw new Error('useGameContext must be used within a GameProvider');
    }
    return context;
};
