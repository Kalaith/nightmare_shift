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
import AlmanacScreen from './screens/AlmanacScreen/AlmanacScreen';
import SkillTreeScreen from './screens/SkillTreeScreen/SkillTreeScreen';
import ErrorBoundary from './ErrorBoundary';

interface ScreenRouterProps {
  gameState: GameState;
  playerStats: PlayerStats;
  showInventory: boolean;
  setShowInventory: (show: boolean) => void;
  onStartGame: () => void;
  onLoadGame: () => void;
  onShowLeaderboard: () => void;
  onShowLoading: () => void;
  onShowSkillTree: () => void;
  onShowAlmanac: () => void;
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
  // Almanac & Skill Tree
  onUpgradeKnowledge?: (passengerId: number) => void;
  onPurchaseSkill?: (skillId: string) => void;
  allPassengers?: Passenger[];
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
  onShowSkillTree,
  onShowAlmanac,
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
  onContinueFromDropOff,
  onUpgradeKnowledge,
  onPurchaseSkill,
  allPassengers
}) => {
  switch (gameState.currentScreen) {
    case SCREENS.LOADING:
      return (
        <LoadingScreen
          playerStats={playerStats}
          onStartGame={onStartGame}
          onLoadGame={onLoadGame}
          onShowLeaderboard={onShowLeaderboard}
          onShowSkillTree={onShowSkillTree}
          onShowAlmanac={onShowAlmanac}
        />
      );

    case SCREENS.LEADERBOARD:
      return (
        <ErrorBoundary>
          <LeaderboardScreen
            leaderboard={LeaderboardService.getLeaderboard()}
            onBack={onShowLoading}
          />
        </ErrorBoundary>
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
          playerStats={playerStats}
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

    case SCREENS.ALMANAC:
      return (
        <ErrorBoundary>
          <AlmanacScreen
            playerStats={playerStats}
            allPassengers={allPassengers || []}
            onUpgradeKnowledge={onUpgradeKnowledge || (() => { })}
            onBack={onShowLoading}
          />
        </ErrorBoundary>
      );

    case SCREENS.SKILL_TREE:
      return (
        <ErrorBoundary>
          <SkillTreeScreen
            playerStats={playerStats}
            onPurchaseSkill={onPurchaseSkill || (() => { })}
            onBack={onShowLoading}
          />
        </ErrorBoundary>
      );

    default:
      return (
        <LoadingScreen
          playerStats={playerStats}
          onStartGame={onStartGame}
          onLoadGame={onLoadGame}
          onShowLeaderboard={onShowLeaderboard}
          onShowSkillTree={onShowSkillTree}
          onShowAlmanac={onShowAlmanac}
        />
      );
  }
};

export default ScreenRouter;