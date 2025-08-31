import type { GameState, PlayerStats, Passenger } from '../types/game';
import { SCREENS } from '../data/constants';

export const createScreenProps = (
  gameState: GameState,
  playerStats: PlayerStats,
  showInventory: boolean,
  setShowInventory: (show: boolean) => void,
  actions: {
    startGame: () => void;
    loadGame: () => void;
    showScreen: (screen: string) => void;
    startShift: () => void;
    saveGame: () => void;
    handleEndShift: (successful: boolean) => void;
    acceptRide: () => void;
    declineRide: () => void;
    handleDrivingChoice: (choice: string, phase: string) => void;
    continueToDestination: () => void;
    gameOver: (reason: string) => void;
    resetGame: () => void;
    useItem?: (itemId: string) => void;
    tradeItem?: (itemId: string, passenger: Passenger) => void;
    refuelFull?: () => void;
    refuelPartial?: () => void;
    continueFromDropOff?: () => void;
  }
) => ({
  gameState,
  playerStats,
  showInventory,
  setShowInventory,
  onStartGame: actions.startGame,
  onLoadGame: actions.loadGame,
  onShowLeaderboard: () => actions.showScreen(SCREENS.LEADERBOARD),
  onShowLoading: () => actions.showScreen(SCREENS.LOADING),
  onStartShift: actions.startShift,
  onSaveGame: actions.saveGame,
  onEndShift: actions.handleEndShift,
  onAcceptRide: actions.acceptRide,
  onDeclineRide: actions.declineRide,
  onHandleDrivingChoice: actions.handleDrivingChoice,
  onContinueToDestination: actions.continueToDestination,
  onGameOver: actions.gameOver,
  onResetAndStart: () => { actions.resetGame(); actions.startGame(); },
  onResetAndShow: (screen: string) => { actions.resetGame(); actions.showScreen(screen); },
  onUseItem: actions.useItem,
  onTradeItem: actions.tradeItem,
  onRefuelFull: actions.refuelFull,
  onRefuelPartial: actions.refuelPartial,
  onContinueFromDropOff: actions.continueFromDropOff
});