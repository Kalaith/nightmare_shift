import React from 'react';
import type { GameState, PlayerStats, Passenger } from '../types/game';
import { SCREENS } from '../data/constants';
import { LeaderboardService } from '../services/storageService';
import LoadingScreen from './screens/LoadingScreen/LoadingScreen';
import LeaderboardScreen from './screens/LeaderboardScreen/LeaderboardScreen';
import BriefingScreen from './screens/BriefingScreen/BriefingScreen';
import GameScreen from './screens/GameScreen/GameScreen';
import GameOverScreen from './screens/GameOverScreen/GameOverScreen';
import SuccessScreen from './screens/SuccessScreen/SuccessScreen';

interface ScreenRouterProps {
  gameState: GameState;
  playerStats: PlayerStats;
  showInventory: boolean;
  setShowInventory: (show: boolean) => void;
  onStartGame: () => void;
  onLoadGame: () => void;
  onShowLeaderboard: () => void;
  onShowLoading: () => void;
  onStartShift: () => void;
  onSaveGame: () => void;
  onEndShift: (successful: boolean) => void;
  onAcceptRide: () => void;
  onDeclineRide: () => void;
  onHandleDrivingChoice: (choice: string, phase: string) => void;
  onContinueToDestination: () => void;
  onGameOver: (reason: string) => void;
  onResetAndStart: () => void;
  onResetAndShow: (screen: string) => void;
  onUseItem?: (itemId: string) => void;
  onTradeItem?: (itemId: string, passenger: Passenger) => void;
  onRefuelFull?: () => void;
  onRefuelPartial?: () => void;
  onContinueFromDropOff?: () => void;
}

const ScreenRouter: React.FC<ScreenRouterProps> = ({
  gameState,
  playerStats,
  showInventory,
  setShowInventory,
  onStartGame,
  onLoadGame,
  onShowLeaderboard,
  onShowLoading,
  onStartShift,
  onSaveGame,
  onEndShift,
  onAcceptRide,
  onDeclineRide,
  onHandleDrivingChoice,
  onContinueToDestination,
  onGameOver,
  onResetAndStart,
  onResetAndShow,
  onUseItem,
  onTradeItem,
  onRefuelFull,
  onRefuelPartial,
  onContinueFromDropOff
}) => {
  switch (gameState.currentScreen) {
    case SCREENS.LOADING:
      return (
        <LoadingScreen
          playerStats={playerStats}
          onStartGame={onStartGame}
          onLoadGame={onLoadGame}
          onShowLeaderboard={onShowLeaderboard}
        />
      );

    case SCREENS.LEADERBOARD:
      return (
        <LeaderboardScreen
          leaderboard={LeaderboardService.getLeaderboard()}
          onBack={onShowLoading}
        />
      );

    case SCREENS.BRIEFING:
      return (
        <BriefingScreen
          gameState={gameState}
          onStartShift={onStartShift}
        />
      );

    case SCREENS.GAME:
      return (
        <GameScreen
          gameState={gameState}
          onSaveGame={onSaveGame}
          onEndShift={onEndShift}
          showInventory={showInventory}
          setShowInventory={setShowInventory}
          onAcceptRide={onAcceptRide}
          onDeclineRide={onDeclineRide}
          onHandleDrivingChoice={onHandleDrivingChoice}
          onContinueToDestination={onContinueToDestination}
          onGameOver={onGameOver}
          onUseItem={onUseItem}
          onTradeItem={onTradeItem}
          onRefuelFull={onRefuelFull}
          onRefuelPartial={onRefuelPartial}
          onContinueFromDropOff={onContinueFromDropOff}
        />
      );

    case SCREENS.GAME_OVER:
      return (
        <GameOverScreen
          gameState={gameState}
          onTryAgain={() => onResetAndShow(SCREENS.LOADING)}
          onShowLeaderboard={onShowLeaderboard}
          onShowMainMenu={onShowLoading}
        />
      );

    case SCREENS.SUCCESS:
      return (
        <SuccessScreen
          gameState={gameState}
          onStartNextShift={onResetAndStart}
          onShowLeaderboard={onShowLeaderboard}
          onShowMainMenu={onShowLoading}
        />
      );

    default:
      return (
        <LoadingScreen
          playerStats={playerStats}
          onStartGame={onStartGame}
          onLoadGame={onLoadGame}
          onShowLeaderboard={onShowLeaderboard}
        />
      );
  }
};

export default ScreenRouter;