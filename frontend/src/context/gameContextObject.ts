import { createContext } from 'react';
import type { GameState } from '../types/game';

export interface GameContextType {
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

export const GameContext = createContext<GameContextType | undefined>(undefined);
