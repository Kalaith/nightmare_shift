import React from 'react';
import { SCREENS } from '../data/constants';
import { LeaderboardService } from '../services/storageService';
import { gameData } from '../data/gameData';
import { useGameContext } from '../hooks/useGameContext';
import { usePlayerContext } from '../hooks/usePlayerContext';
import { useUIContext } from '../hooks/useUIContext';

import LoadingScreen from './screens/LoadingScreen/LoadingScreen';
import LeaderboardScreen from './screens/LeaderboardScreen/LeaderboardScreen';
import BriefingScreen from './screens/BriefingScreen/BriefingScreen';
import GameScreen from './screens/GameScreen/GameScreen';
import GameOverScreen from './screens/GameOverScreen/GameOverScreen';
import SuccessScreen from './screens/SuccessScreen/SuccessScreen';
import AlmanacScreen from './screens/AlmanacScreen/AlmanacScreen';
import SkillTreeScreen from './screens/SkillTreeScreen/SkillTreeScreen';
import ErrorBoundary from './ErrorBoundary';

const ScreenRouter: React.FC = () => {
  const { gameState, startGame, loadGame, startShift, resetGame } = useGameContext();

  const { playerStats, upgradeKnowledge, purchaseSkill, user, isAuthenticated, isLoading: authLoading } = usePlayerContext();

  const { currentScreen, showScreen } = useUIContext();

  const handleResetAndShow = (screen: string) => {
    resetGame();
    showScreen(screen);
  };

  const handleStartNextShift = () => {
    // For next shift, we usually just start shift, maybe retaining some state?
    // If it's a roguelike run, we don't reset everything.
    // But original code mapped onResetAndStart.
    // Let's assume startShift is enough for now, or resetGame if it's a new run.
    // If SuccessScreen implies "Next Level", startShift is appropriate.
    startShift();
  };

  switch (currentScreen) {
    case SCREENS.LOADING:
      return (
        <LoadingScreen
          playerStats={playerStats}
          user={user}
          isAuthenticated={isAuthenticated}
          authLoading={authLoading}
          onStartGame={startGame}
          onLoadGame={loadGame}
          onShowLeaderboard={() => showScreen(SCREENS.LEADERBOARD)}
          onShowSkillTree={() => showScreen(SCREENS.SKILL_TREE)}
          onShowAlmanac={() => showScreen(SCREENS.ALMANAC)}
        />
      );

    case SCREENS.LEADERBOARD:
      return (
        <ErrorBoundary>
          <LeaderboardScreen
            leaderboard={LeaderboardService.getLeaderboard()}
            onBack={() => showScreen(SCREENS.LOADING)}
          />
        </ErrorBoundary>
      );

    case SCREENS.BRIEFING:
      return <BriefingScreen gameState={gameState} onStartShift={startShift} />;

    case SCREENS.GAME:
      return <GameScreen />;

    case SCREENS.GAME_OVER:
      return (
        <GameOverScreen
          gameState={gameState}
          onTryAgain={() => handleResetAndShow(SCREENS.LOADING)}
          onShowLeaderboard={() => showScreen(SCREENS.LEADERBOARD)}
          onShowMainMenu={() => showScreen(SCREENS.LOADING)}
        />
      );

    case SCREENS.SUCCESS:
      return (
        <SuccessScreen
          gameState={gameState}
          onStartNextShift={handleStartNextShift}
          onShowLeaderboard={() => showScreen(SCREENS.LEADERBOARD)}
          onShowMainMenu={() => showScreen(SCREENS.LOADING)}
        />
      );

    case SCREENS.ALMANAC:
      return (
        <ErrorBoundary>
          <AlmanacScreen
            playerStats={playerStats}
            allPassengers={gameData.passengers || []}
            onUpgradeKnowledge={upgradeKnowledge}
            onBack={() => showScreen(SCREENS.LOADING)}
          />
        </ErrorBoundary>
      );

    case SCREENS.SKILL_TREE:
      return (
        <ErrorBoundary>
          <SkillTreeScreen
            playerStats={playerStats}
            onPurchaseSkill={purchaseSkill}
            onBack={() => showScreen(SCREENS.LOADING)}
          />
        </ErrorBoundary>
      );

    default:
      return (
        <LoadingScreen
          playerStats={playerStats}
          user={user}
          isAuthenticated={isAuthenticated}
          authLoading={authLoading}
          onStartGame={startGame}
          onLoadGame={loadGame}
          onShowLeaderboard={() => showScreen(SCREENS.LEADERBOARD)}
          onShowSkillTree={() => showScreen(SCREENS.SKILL_TREE)}
          onShowAlmanac={() => showScreen(SCREENS.ALMANAC)}
        />
      );
  }
};

export default ScreenRouter;
