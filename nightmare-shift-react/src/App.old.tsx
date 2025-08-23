import React, { useState, useEffect } from 'react';
import './App.css';
import { gameData } from './data/gameData';
import { STORAGE_KEYS, GAME_CONSTANTS, SCREENS, GAME_PHASES } from './data/constants';
import { ReputationService, RouteService } from './services/reputationService';
import { GameEngine } from './services/gameEngine';
import { PassengerService } from './services/passengerService';
import LocalStorage, { PlayerStatsService, LeaderboardService, SaveGameService } from './services/storageService';
import GameOverScreen from './components/screens/GameOverScreen/GameOverScreen';
import LoadingScreen from './components/screens/LoadingScreen/LoadingScreen';
import LeaderboardScreen from './components/screens/LeaderboardScreen/LeaderboardScreen';
import BriefingScreen from './components/screens/BriefingScreen/BriefingScreen';
import GameScreen from './components/screens/GameScreen/GameScreen';
import SuccessScreen from './components/screens/SuccessScreen/SuccessScreen';
import type { PlayerStats, GameState, Passenger, LeaderboardEntry, SaveData } from './types/game';

const getDefaultPlayerStats = (): PlayerStats => ({
  totalShiftsCompleted: 0,
  totalShiftsStarted: 0,
  totalRidesCompleted: 0,
  totalEarnings: 0,
  totalFuelUsed: 0,
  totalTimePlayedMinutes: 0,
  bestShiftEarnings: 0,
  bestShiftRides: 0,
  longestShiftMinutes: 0,
  passengersEncountered: new Set(),
  rulesViolatedHistory: [],
  backstoriesUnlocked: new Set(),
  legendaryPassengersEncountered: new Set(),
  achievementsUnlocked: new Set(),
  firstPlayDate: Date.now(),
  lastPlayDate: Date.now()
});

function App() {
  const [playerStats, setPlayerStats] = useState<PlayerStats>(() => 
    LocalStorage.load(STORAGE_KEYS.PLAYER_STATS, getDefaultPlayerStats())
  );

  const [gameState, setGameState] = useState<GameState>({
    currentScreen: SCREENS.LOADING,
    fuel: GAME_CONSTANTS.INITIAL_FUEL,
    earnings: 0,
    timeRemaining: GAME_CONSTANTS.INITIAL_TIME,
    ridesCompleted: 0,
    rulesViolated: 0,
    currentRules: [],
    inventory: [],
    currentPassenger: null,
    currentRide: null,
    gamePhase: GAME_PHASES.WAITING,
    usedPassengers: [],
    shiftStartTime: null,
    sessionStartTime: Date.now(),
    passengerReputation: ReputationService.initializeReputation(),
    minimumEarnings: GAME_CONSTANTS.MINIMUM_EARNINGS,
    routeHistory: []
  });

  const [showInventory, setShowInventory] = useState(false);

  // Game timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      if (gameState.currentScreen === SCREENS.GAME && gameState.timeRemaining > 0) {
        setGameState(prev => {
          const newTime = prev.timeRemaining - 1;
          if (newTime <= 0) {
            setTimeout(() => endShift(false), 100);
          }
          return { ...prev, timeRemaining: newTime };
        });
      }
    }, 30000);

    return () => clearInterval(timer);
  }, [gameState.currentScreen, gameState.timeRemaining]);

  // Screen management
  const showScreen = (screenName: string) => {
    setGameState(prev => ({ ...prev, currentScreen: screenName }));
  };

  // Generate shift rules
  const generateShiftRules = () => {
    const playerExperience = GameEngine.calculatePlayerExperience(playerStats);
    const engineResult = GameEngine.generateShiftRules(playerExperience);

    setGameState(prev => ({
      ...prev,
      currentRules: engineResult.visibleRules,
      hiddenRules: engineResult.hiddenRules,
      ruleConflicts: engineResult.conflicts || [],
      difficultyLevel: engineResult.difficultyLevel
    }));
  };

  // Check for hidden rule violations
  const checkHiddenRuleViolations = (gs: GameState, passenger: Passenger) => 
    GameEngine.checkHiddenRuleViolations(gs, passenger);

  // Update player statistics
  const updatePlayerStats = (updates: Partial<PlayerStats>) => {
    const stats = PlayerStatsService.getStats();
    const updated = { ...stats, ...updates, lastPlayDate: Date.now() };
    LocalStorage.save(STORAGE_KEYS.PLAYER_STATS, updated);
    setPlayerStats(updated);
  };

  // Add to leaderboard
  const addToLeaderboard = (shiftData: {
    earnings: number;
    ridesCompleted: number;
    timeSpent: number;
    successful: boolean;
    rulesViolated: number;
    passengersEncountered: number;
    difficultyLevel: number;
  }) => {
    const score = GameEngine.calculateScore(shiftData.earnings, shiftData.ridesCompleted, shiftData.timeSpent);
    const entry: LeaderboardEntry = {
      score,
      timeRemaining: shiftData.timeSpent || 0,
      date: new Date().toLocaleDateString(),
      survived: shiftData.successful || false,
      passengersTransported: shiftData.ridesCompleted || 0,
      difficultyLevel: shiftData.difficultyLevel || 0,
      rulesViolated: shiftData.rulesViolated || 0
    };

    LeaderboardService.addScore(entry);
  };

  // Save/Load game state
  const saveGame = () => {
    if (gameState.currentScreen === SCREENS.GAME && gameState.gamePhase !== GAME_PHASES.WAITING) {
      const saveData: SaveData = {
        gameState: { ...gameState, sessionStartTime: Date.now() },
        playerStats,
        timestamp: Date.now(),
        version: '1.0'
      };
      SaveGameService.saveGame(saveData);

      setGameState(prev => ({
        ...prev,
        showSaveNotification: true
      }));

      setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          showSaveNotification: false
        }));
      }, 2000);
    }
  };

  const loadGame = () => {
    const saveData = SaveGameService.loadGame();
    if (saveData?.gameState) {
      setGameState(saveData.gameState);
      if (saveData.playerStats) setPlayerStats(saveData.playerStats);
      showScreen(SCREENS.GAME);
    }
  };

  const hasSavedGame = () => SaveGameService.hasSavedGame();
  const deleteSavedGame = () => SaveGameService.clearSave();

  // Get random passenger
  const getRandomPassenger = (): Passenger | null => {
    const related = PassengerService.shouldSpawnRelatedPassenger(gameState.completedRides || []);
    if (related) {
      setGameState(prev => ({
        ...prev,
        usedPassengers: [...prev.usedPassengers, related.id],
        currentPassenger: related,
        relationshipTriggered: related.id
      }));
      return related;
    }

    const passenger = PassengerService.selectRandomPassenger(gameState.usedPassengers || [], gameState.difficultyLevel || 0);
    if (!passenger) return null;

    const backstoryUnlocked = PassengerService.checkBackstoryUnlock(
      passenger, 
      !gameState.usedPassengers.includes(passenger.id)
    );

    setGameState(prev => ({ 
      ...prev, 
      usedPassengers: [...prev.usedPassengers, passenger.id],
      currentPassenger: { ...passenger, backstoryUnlocked },
      relationshipTriggered: null
    }));

    return { ...passenger, backstoryUnlocked };
  };

  // Game functions
  const startGame = () => {
    generateShiftRules();
    updatePlayerStats({ 
      totalShiftsStarted: playerStats.totalShiftsStarted + 1 
    });
    showScreen(SCREENS.BRIEFING);
  };

  const startShift = () => {
    showScreen(SCREENS.GAME);
    setGameState(prev => ({ 
      ...prev, 
      gamePhase: GAME_PHASES.WAITING,
      shiftStartTime: Date.now()
    }));
    
    setTimeout(() => {
      showRideRequest();
    }, 2000 + Math.random() * 3000);
  };

  const showRideRequest = () => {
    const passenger = getRandomPassenger();
    if (!passenger) {
      endShift(true);
      return;
    }
    setGameState(prev => ({ ...prev, gamePhase: GAME_PHASES.RIDE_REQUEST }));
  };

  const acceptRide = () => {
    if (gameState.fuel < 20) {
      gameOver("You ran out of fuel with a passenger in the car. They were not pleased...");
      return;
    }
    startDriving('pickup');
  };

  const declineRide = () => {
    setGameState(prev => ({ 
      ...prev, 
      timeRemaining: prev.timeRemaining - 5,
      gamePhase: GAME_PHASES.WAITING
    }));
    setTimeout(() => {
      showRideRequest();
    }, 1000 + Math.random() * 2000);
  };

  const startDriving = (phase: string) => {
    const passenger = gameState.currentPassenger;
    if (!passenger) return;

    const location = gameData.locations.find(loc => 
      loc.name === (phase === 'pickup' ? passenger.pickup : passenger.destination)
    );
    
    setGameState(prev => ({ 
      ...prev, 
      gamePhase: GAME_PHASES.DRIVING,
      currentDrivingPhase: phase,
      currentLocation: location
    }));
  };

  const handleDrivingChoice = (choice: string, phase: string) => {
    const routeChoice = choice as 'normal' | 'shortcut' | 'scenic' | 'police';
    const passengerRiskLevel = gameState.currentPassenger ? 
      gameData.locations.find(loc => loc.name === gameState.currentPassenger?.pickup)?.riskLevel || 1 : 1;
    
    const routeCosts = RouteService.calculateRouteCosts(routeChoice, passengerRiskLevel);
    
    // Check if player has enough resources
    if (gameState.fuel < routeCosts.fuelCost) {
      gameOver("You don't have enough fuel for this route. Your car sputtered to a stop...");
      return;
    }
    
    if (gameState.timeRemaining < routeCosts.timeCost) {
      gameOver("This route would take too long. Time ran out before you could reach your destination...");
      return;
    }

    // Check rule violations
    if (routeChoice === 'shortcut') {
      const routeRestriction = gameState.currentRules.find(rule => rule.id === 5);
      if (routeRestriction) {
        gameOver("You deviated from the GPS route. Your passenger noticed... and they were not forgiving.");
        return;
      }
    }

    // Apply route effects
    let bonusEarnings = 0;
    if (routeChoice === 'scenic' && gameState.currentPassenger) {
      bonusEarnings = 10; // Scenic route bonus
    }

    // Record route choice in history
    const routeHistoryEntry = {
      choice: routeChoice,
      phase: phase as 'pickup' | 'destination',
      fuelCost: routeCosts.fuelCost,
      timeCost: routeCosts.timeCost,
      riskLevel: routeCosts.riskLevel,
      passenger: gameState.currentPassenger?.id,
      timestamp: Date.now()
    };

    setGameState(prev => ({ 
      ...prev, 
      fuel: prev.fuel - routeCosts.fuelCost,
      timeRemaining: prev.timeRemaining - routeCosts.timeCost,
      earnings: prev.earnings + bonusEarnings,
      routeHistory: [...prev.routeHistory, routeHistoryEntry]
    }));

    // Handle supernatural encounters based on risk level
    if (routeCosts.riskLevel > 2 && Math.random() < 0.3) {
      // Potential rule violation or supernatural event
      console.log(`High risk route taken (${routeCosts.riskLevel}), supernatural encounter possible...`);
    }

    if (phase === 'pickup') {
      startPassengerInteraction();
    } else {
      completeRide();
    }
  };

  const startPassengerInteraction = () => {
    const passenger = gameState.currentPassenger;
    if (!passenger) return;

    const dialogue = passenger.dialogue[Math.floor(Math.random() * passenger.dialogue.length)];

    setGameState(prev => ({ 
      ...prev, 
      gamePhase: GAME_PHASES.INTERACTION,
      currentDialogue: dialogue
    }));
  };

  const completeRide = () => {
    const passenger = gameState.currentPassenger;
    if (!passenger) return;

    const backstoryUnlockChance = gameState.usedPassengers.filter(id => id === passenger.id).length > 1 
      ? GAME_CONSTANTS.BACKSTORY_UNLOCK_REPEAT 
      : GAME_CONSTANTS.BACKSTORY_UNLOCK_FIRST;
    const unlockBackstory = Math.random() < backstoryUnlockChance;

    const hiddenRuleViolation = checkHiddenRuleViolations(gameState, passenger);

    if (hiddenRuleViolation) {
      setGameState(prev => ({
        ...prev,
        revealedHiddenRules: [...(prev.revealedHiddenRules || []), hiddenRuleViolation.rule]
      }));

      setTimeout(() => {
        if (hiddenRuleViolation.rule.violationMessage) {
          gameOver(hiddenRuleViolation.rule.violationMessage);
        }
      }, 1000);
      return;
    }

    setGameState(prev => ({ 
      ...prev, 
      earnings: prev.earnings + passenger.fare,
      ridesCompleted: prev.ridesCompleted + 1,
      inventory: [...prev.inventory, ...passenger.items.map(item => ({
        name: item,
        source: passenger.name,
        backstoryItem: unlockBackstory
      }))],
      gamePhase: GAME_PHASES.WAITING,
      completedRides: [...(prev.completedRides || []), {
        passenger,
        duration: 0,
        timestamp: Date.now()
      }]
    }));

    if (unlockBackstory && passenger.backstoryDetails) {
      setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          showBackstoryNotification: {
            passenger: passenger.name,
            backstory: passenger.backstoryDetails!
          }
        }));
      }, 1500);
    }

    setTimeout(() => {
      if (gameState.timeRemaining <= 60 || gameState.fuel <= 15) {
        endShift(true);
      } else {
        setTimeout(() => {
          showRideRequest();
        }, 3000 + Math.random() * 4000);
      }
    }, 1000);
  };

  const continueToDestination = () => {
    startDriving('destination');
  };

  const gameOver = (reason: string) => {
    setGameState(prev => ({ 
      ...prev, 
      rulesViolated: prev.rulesViolated + 1,
      gameOverReason: reason
    }));
    showScreen(SCREENS.GAME_OVER);
  };

  const endShift = (successful: boolean) => {
    const shiftEndTime = Date.now();
    const shiftDuration = gameState.shiftStartTime ? 
      Math.round((shiftEndTime - gameState.shiftStartTime) / (1000 * 60)) : 0;

    // Check if minimum earnings requirement was met
    const earnedEnough = gameState.earnings >= gameState.minimumEarnings;
    const actuallySuccessful = successful && earnedEnough;

    const shiftData = {
      earnings: gameState.earnings,
      ridesCompleted: gameState.ridesCompleted,
      timeSpent: shiftDuration,
      successful: actuallySuccessful,
      rulesViolated: gameState.rulesViolated || 0,
      passengersEncountered: gameState.usedPassengers.length,
      difficultyLevel: gameState.difficultyLevel || 0
    };

    if (actuallySuccessful) {
      const survivalBonus = GAME_CONSTANTS.SURVIVAL_BONUS;
      const finalEarnings = gameState.earnings + survivalBonus;

      setGameState(prev => ({ 
        ...prev, 
        earnings: finalEarnings,
        survivalBonus
      }));

      updatePlayerStats({
        totalShiftsCompleted: playerStats.totalShiftsCompleted + 1,
        totalRidesCompleted: playerStats.totalRidesCompleted + gameState.ridesCompleted,
        totalEarnings: playerStats.totalEarnings + finalEarnings,
        bestShiftEarnings: Math.max(playerStats.bestShiftEarnings, finalEarnings),
        bestShiftRides: Math.max(playerStats.bestShiftRides, gameState.ridesCompleted),
        longestShiftMinutes: Math.max(playerStats.longestShiftMinutes, shiftDuration),
        totalTimePlayedMinutes: playerStats.totalTimePlayedMinutes + shiftDuration
      });

      addToLeaderboard({ ...shiftData, earnings: finalEarnings });
      deleteSavedGame();
      showScreen(SCREENS.SUCCESS);
    } else {
      updatePlayerStats({
        totalTimePlayedMinutes: playerStats.totalTimePlayedMinutes + shiftDuration,
        totalRidesCompleted: playerStats.totalRidesCompleted + gameState.ridesCompleted,
        totalEarnings: playerStats.totalEarnings + gameState.earnings
      });

      addToLeaderboard(shiftData);
      
      // Determine failure reason
      let failureReason: string;
      if (!successful) {
        failureReason = "Time ran out or you ran out of fuel. The night shift waits for no one...";
      } else if (!earnedEnough) {
        failureReason = `Shift failed: You only earned $${gameState.earnings} but needed $${gameState.minimumEarnings}. The company expects better performance.`;
      } else {
        failureReason = "The night shift has ended in failure...";
      }
      
      gameOver(failureReason);
    }
  };

  const resetGame = () => {
    setGameState({
      currentScreen: SCREENS.LOADING,
      fuel: GAME_CONSTANTS.INITIAL_FUEL,
      earnings: 0,
      timeRemaining: GAME_CONSTANTS.INITIAL_TIME,
      ridesCompleted: 0,
      rulesViolated: 0,
      currentRules: [],
      inventory: [],
      currentPassenger: null,
      currentRide: null,
      gamePhase: GAME_PHASES.WAITING,
      usedPassengers: [],
      shiftStartTime: null,
      sessionStartTime: Date.now(),
      passengerReputation: ReputationService.initializeReputation(),
      minimumEarnings: GAME_CONSTANTS.MINIMUM_EARNINGS,
      routeHistory: []
    });
  };

  return (
    <div>
      {gameState.currentScreen === SCREENS.LOADING && (
        <LoadingScreen
          playerStats={playerStats}
          onStartGame={startGame}
          onLoadGame={loadGame}
          onShowLeaderboard={() => showScreen(SCREENS.LEADERBOARD)}
        />
      )}

      {gameState.currentScreen === SCREENS.LEADERBOARD && (
        <LeaderboardScreen
          leaderboard={LeaderboardService.getLeaderboard()}
          onBack={() => showScreen(SCREENS.LOADING)}
        />
      )}

      {gameState.currentScreen === SCREENS.BRIEFING && (
        <BriefingScreen
          gameState={gameState}
          onStartShift={startShift}
        />
      )}

      {gameState.currentScreen === SCREENS.GAME && (
        <GameScreen
          gameState={gameState}
          onSaveGame={saveGame}
          onEndShift={endShift}
          showInventory={showInventory}
          setShowInventory={setShowInventory}
          onAcceptRide={acceptRide}
          onDeclineRide={declineRide}
          onHandleDrivingChoice={handleDrivingChoice}
          onContinueToDestination={continueToDestination}
          onGameOver={gameOver}
        />
      )}

      {gameState.currentScreen === SCREENS.GAME_OVER && (
        <GameOverScreen
          gameState={gameState}
          onTryAgain={() => { resetGame(); showScreen(SCREENS.LOADING); }}
          onShowLeaderboard={() => showScreen(SCREENS.LEADERBOARD)}
          onShowMainMenu={() => showScreen(SCREENS.LOADING)}
        />
      )}

      {gameState.currentScreen === SCREENS.SUCCESS && (
        <SuccessScreen
          gameState={gameState}
          onStartNextShift={() => { resetGame(); generateShiftRules(); showScreen(SCREENS.BRIEFING); }}
          onShowLeaderboard={() => showScreen(SCREENS.LEADERBOARD)}
          onShowMainMenu={() => showScreen(SCREENS.LOADING)}
        />
      )}
    </div>
  );
}

export default App;