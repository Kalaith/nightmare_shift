import React, { useState } from 'react';
import type { GameState, Passenger, PlayerStats } from '../../../types/game';
import { RouteService } from '../../../services/reputationService';
import { gameData } from '../../../data/gameData';
import { GAME_BALANCE } from '../../../constants/gameBalance';
import { GameResultHelpers } from '../../../utils/errorHandling';
import InventoryModal from '../../game/InventoryModal/InventoryModal';
import WeatherDisplay from '../../game/WeatherDisplay/WeatherDisplay';
import WaitingState from '../../game/WaitingState/WaitingState';
import DropOffState from '../../game/DropOffState/DropOffState';
import Portrait from '../../common/Portrait/Portrait';

interface GameScreenProps {
  gameState: GameState;
  playerStats: PlayerStats;
  onSaveGame: () => void;
  onEndShift: (successful: boolean) => void;
  showInventory: boolean;
  setShowInventory: (show: boolean) => void;
  onAcceptRide: () => void;
  onDeclineRide: () => void;
  onHandleDrivingChoice: (choice: string, phase: string) => void;
  onContinueToDestination: () => void;
  onGameOver: (reason: string) => void;
  onUseItem?: (itemId: string) => void;
  onTradeItem?: (itemId: string, passenger: Passenger) => void;
  onRefuelFull?: () => void;
  onRefuelPartial?: () => void;
  onContinueFromDropOff?: () => void;
}

const GameScreen: React.FC<GameScreenProps> = ({
  gameState,
  playerStats,
  onSaveGame,
  onEndShift,
  showInventory,
  setShowInventory,
  onAcceptRide,
  onDeclineRide,
  onHandleDrivingChoice,
  onContinueToDestination,
  onGameOver,
  onUseItem,
  onTradeItem,
  onRefuelFull,
  onRefuelPartial,
  onContinueFromDropOff
}) => {
  const [showQuickRules, setShowQuickRules] = useState(false);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / GAME_BALANCE.TIME_FORMATTING.MINUTES_PER_HOUR);
    const mins = minutes % GAME_BALANCE.TIME_FORMATTING.MINUTES_PER_HOUR;
    return `${hours}:${mins.toString().padStart(
      GAME_BALANCE.TIME_FORMATTING.PAD_START_LENGTH,
      GAME_BALANCE.TIME_FORMATTING.PAD_CHARACTER
    )}`;
  };

  const handleEndShiftEarly = () => {
    const confirm = window.confirm("Are you sure you want to end your shift early? This will count as a failed shift.");
    if (confirm) {
      onEndShift(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-800 to-slate-900 text-white">
      {/* Game Stats Header */}
      <div className="bg-gray-800/90 border-b border-gray-600 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="bg-gray-700 px-3 py-1 rounded">
              ⏰ {formatTime(gameState.timeRemaining)}
            </div>
            <div className="bg-gray-700 px-3 py-1 rounded">
              ⛽ {gameState.fuel}%
            </div>
            <div className={`px-3 py-1 rounded ${gameState.earnings >= gameState.minimumEarnings
              ? 'bg-green-700'
              : 'bg-gray-700'
              }`}>
              💰 ${gameState.earnings}/${gameState.minimumEarnings}
            </div>
            <div className="bg-gray-700 px-3 py-1 rounded">
              🚗 {gameState.ridesCompleted} rides
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={onSaveGame} className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded text-sm transition-colors">
              💾 Save
            </button>
            <button onClick={handleEndShiftEarly} className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded text-sm transition-colors">
              ⏹️ End Shift
            </button>
          </div>
        </div>

        {/* Weather Display */}
        <WeatherDisplay
          weather={gameState.currentWeather}
          timeOfDay={gameState.timeOfDay}
          season={gameState.season}
          hazards={gameState.environmentalHazards}
          showDetails={false}
        />
      </div>

      <div className="p-5">
        {/* Rules Toggle */}
        <div className="mb-6">
          <button
            onClick={() => setShowQuickRules(!showQuickRules)}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition-colors"
          >
            📋 {showQuickRules ? 'Hide' : 'Show'} Rules
          </button>
          {showQuickRules && (
            <div className="mt-4 bg-gray-800/50 border border-gray-600 rounded p-4">
              <div className="grid gap-3">
                {gameState.currentRules.map((rule, index) => (
                  <div key={rule.id} className="bg-gray-700/50 p-3 rounded">
                    <strong className="text-teal-300">{index + 1}. {rule.title}</strong>
                    <p className="text-gray-300 text-sm mt-1">{rule.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Game Content */}
        <div className="max-w-4xl mx-auto">
          {gameState.gamePhase === 'waiting' && (
            <WaitingState
              gameState={gameState}
              showInventory={showInventory}
              onToggleInventory={() => setShowInventory(!showInventory)}
              onRefuelFull={onRefuelFull || (() => { })}
              onRefuelPartial={onRefuelPartial || (() => { })}
            />
          )}

          {gameState.gamePhase === 'rideRequest' && gameState.currentPassenger && (
            <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-teal-300 mb-4">📱 New Ride Request</h2>
              <div className="flex items-start gap-4 mb-6">
                <Portrait
                  passengerName={gameState.currentPassenger.name}
                  emoji={gameState.currentPassenger.emoji}
                  size="large"
                  className="flex-shrink-0"
                />
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">{gameState.currentPassenger.name}</h3>
                  <p className="text-gray-300">From: {gameState.currentPassenger.pickup}</p>
                  <p className="text-gray-300">To: {gameState.currentPassenger.destination}</p>
                  <p className="text-green-400 font-semibold mt-2">Fare: ${gameState.currentPassenger.fare}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={onAcceptRide}
                  className="flex-1 bg-green-600 hover:bg-green-500 py-3 px-4 rounded-lg font-semibold transition-colors"
                >
                  Accept Ride
                </button>
                <button
                  onClick={onDeclineRide}
                  className="flex-1 bg-red-600 hover:bg-red-500 py-3 px-4 rounded-lg font-semibold transition-colors"
                >
                  Decline
                </button>
              </div>
            </div>
          )}

          {gameState.gamePhase === 'driving' && (() => {
            const passengerRiskLevel = gameState.currentPassenger ?
              gameData.locations.find(loc => loc.name === gameState.currentPassenger?.pickup)?.riskLevel || GAME_BALANCE.PASSENGER_SELECTION.DEFAULT_RISK_LEVEL : GAME_BALANCE.PASSENGER_SELECTION.DEFAULT_RISK_LEVEL;
            const routeOptionsResult = RouteService.getRouteOptions(
              gameState.fuel,
              gameState.timeRemaining,
              passengerRiskLevel,
              gameState.currentWeather,
              gameState.timeOfDay,
              gameState.environmentalHazards,
              gameState.currentPassenger || undefined,
              gameState.routeMastery,
              gameState.routeConsequences,
              playerStats
            );
            const routeOptions = GameResultHelpers.unwrapOr(routeOptionsResult, []);


            // If we somehow still have no routes, provide a basic fallback
            if (routeOptions.length === 0) {
              const basicRoutes = [
                {
                  type: 'normal' as const,
                  name: 'Take Detour Route',
                  description: 'Alternative route through side streets',
                  fuelCost: Math.min(15, gameState.fuel),
                  timeCost: Math.min(20, gameState.timeRemaining),
                  riskLevel: 1,
                  available: gameState.fuel >= 1 && gameState.timeRemaining >= 1,
                  bonusInfo: 'Last available route',
                  passengerReaction: 'neutral' as const,
                  fareModifier: 1.0
                }
              ];

              return (
                <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-6">
                  <h2 className="text-2xl font-bold text-teal-300 mb-4 text-center">🚗 Taking a Detour</h2>
                  <p className="text-gray-300 mb-6 text-center">Road conditions force an alternate route:</p>

                  <div className="grid gap-3 max-w-4xl mx-auto">
                    {basicRoutes.map((route) => (
                      <button
                        key={route.type}
                        onClick={() => onHandleDrivingChoice(route.type, gameState.currentDrivingPhase || 'pickup')}
                        disabled={!route.available}
                        className="p-4 rounded-lg font-semibold transition-all duration-200 text-left bg-gradient-to-br from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white border border-slate-500/50 hover:border-slate-400/70 shadow-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-lg font-bold">{route.name}</div>
                            <div className="text-sm opacity-90">{route.description}</div>
                            <div className="text-xs mt-1 font-medium text-amber-200/80">{route.bonusInfo}</div>
                          </div>
                          <div className="text-right text-sm space-y-1">
                            <div className="flex items-center gap-1 justify-end">
                              <span className="text-blue-300">⛽</span>
                              <span className="text-blue-200">-{route.fuelCost} fuel</span>
                            </div>
                            <div className="flex items-center gap-1 justify-end">
                              <span className="text-cyan-300">⏰</span>
                              <span className="text-cyan-200">-{route.timeCost} min</span>
                            </div>
                            <div className="flex items-center gap-1 justify-end">
                              <span className="text-gray-400">⚠️</span>
                              <span className="text-gray-300">Risk: {route.riskLevel}</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-teal-300 mb-4 text-center">🚗 Driving to {gameState.currentDrivingPhase}...</h2>
                <p className="text-gray-300 mb-6 text-center">Choose your route carefully:</p>

                <div className="grid gap-3 max-w-4xl mx-auto">
                  {routeOptions.map((route) => (
                    <button
                      key={route.type}
                      onClick={() => onHandleDrivingChoice(route.type, gameState.currentDrivingPhase || 'pickup')}
                      disabled={!route.available}
                      className={`p-4 rounded-lg font-semibold transition-all duration-200 text-left relative shadow-lg ${!route.available
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50 border border-slate-700'
                        : route.riskLevel >= 4
                          ? route.type === 'normal'
                            ? 'bg-gradient-to-br from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white border-2 border-amber-500 shadow-amber-500/20'
                            : route.type === 'shortcut'
                              ? 'bg-gradient-to-br from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-white border-2 border-amber-500 shadow-amber-500/20'
                              : route.type === 'scenic'
                                ? 'bg-gradient-to-br from-emerald-800 to-slate-800 hover:from-emerald-700 hover:to-slate-700 text-white border-2 border-amber-500 shadow-amber-500/20'
                                : 'bg-gradient-to-br from-indigo-800 to-slate-800 hover:from-indigo-700 hover:to-slate-700 text-white border-2 border-amber-500 shadow-amber-500/20'
                          : route.riskLevel >= 3
                            ? route.type === 'normal'
                              ? 'bg-gradient-to-br from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white border border-yellow-400/60 shadow-yellow-400/10'
                              : route.type === 'shortcut'
                                ? 'bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white border border-yellow-400/60 shadow-yellow-400/10'
                                : route.type === 'scenic'
                                  ? 'bg-gradient-to-br from-emerald-700 to-slate-700 hover:from-emerald-600 hover:to-slate-600 text-white border border-yellow-400/60 shadow-yellow-400/10'
                                  : 'bg-gradient-to-br from-indigo-700 to-slate-700 hover:from-indigo-600 hover:to-slate-600 text-white border border-yellow-400/60 shadow-yellow-400/10'
                            : route.passengerReaction === 'positive'
                              ? route.type === 'normal'
                                ? 'bg-gradient-to-br from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white border-2 border-emerald-400/80 shadow-emerald-400/20'
                                : route.type === 'shortcut'
                                  ? 'bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white border-2 border-emerald-400/80 shadow-emerald-400/20'
                                  : route.type === 'scenic'
                                    ? 'bg-gradient-to-br from-emerald-700 to-emerald-800 hover:from-emerald-600 hover:to-emerald-700 text-white border-2 border-emerald-400/80 shadow-emerald-400/20'
                                    : 'bg-gradient-to-br from-indigo-700 to-indigo-800 hover:from-indigo-600 hover:to-indigo-700 text-white border-2 border-emerald-400/80 shadow-emerald-400/20'
                              : route.passengerReaction === 'negative'
                                ? route.type === 'normal'
                                  ? 'bg-gradient-to-br from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white border-2 border-rose-400/60 shadow-rose-400/10'
                                  : route.type === 'shortcut'
                                    ? 'bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white border-2 border-rose-400/60 shadow-rose-400/10'
                                    : route.type === 'scenic'
                                      ? 'bg-gradient-to-br from-emerald-700 to-slate-700 hover:from-emerald-600 hover:to-slate-600 text-white border-2 border-rose-400/60 shadow-rose-400/10'
                                      : 'bg-gradient-to-br from-indigo-700 to-slate-700 hover:from-indigo-600 hover:to-slate-600 text-white border-2 border-rose-400/60 shadow-rose-400/10'
                                : route.type === 'normal'
                                  ? 'bg-gradient-to-br from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white border border-slate-500/50 hover:border-slate-400/70'
                                  : route.type === 'shortcut'
                                    ? 'bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white border border-gray-500/50 hover:border-gray-400/70'
                                    : route.type === 'scenic'
                                      ? 'bg-gradient-to-br from-emerald-700 to-emerald-800 hover:from-emerald-600 hover:to-emerald-700 text-white border border-emerald-500/50 hover:border-emerald-400/70'
                                      : 'bg-gradient-to-br from-indigo-700 to-indigo-800 hover:from-indigo-600 hover:to-indigo-700 text-white border border-indigo-500/50 hover:border-indigo-400/70'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-lg font-bold flex items-center gap-2">
                            {route.name}
                            {route.fareModifier && route.fareModifier !== 1.0 && (
                              <span className={`text-xs px-2 py-1 rounded-md backdrop-blur-sm ${route.fareModifier > 1.0
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                }`}>
                                {route.fareModifier > 1.0 ? '+' : ''}{Math.round((route.fareModifier - 1) * 100)}% fare
                              </span>
                            )}
                          </div>
                          <div className="text-sm opacity-90">{route.description}</div>
                          {route.bonusInfo && (
                            <div className="text-xs mt-1 font-medium text-amber-200/80">{route.bonusInfo}</div>
                          )}
                        </div>
                        <div className="text-right text-sm space-y-1">
                          <div className="flex items-center gap-1 justify-end">
                            <span className="text-blue-300">⛽</span>
                            <span className="text-blue-200">-{route.fuelCost} fuel</span>
                          </div>
                          <div className="flex items-center gap-1 justify-end">
                            <span className="text-cyan-300">⏰</span>
                            <span className="text-cyan-200">-{route.timeCost} min</span>
                          </div>
                          <div className="flex items-center gap-1 justify-end">
                            <span className={route.riskLevel >= 4 ? "text-amber-400" : route.riskLevel >= 3 ? "text-yellow-400" : "text-gray-400"}>⚠️</span>
                            <span className={route.riskLevel >= 4 ? "text-amber-300" : route.riskLevel >= 3 ? "text-yellow-300" : "text-gray-300"}>Risk: {route.riskLevel}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-4 text-center text-gray-400 text-sm">
                  Current: ⛽ {gameState.fuel} fuel • ⏰ {Math.floor(gameState.timeRemaining)} min • 💰 ${gameState.earnings}
                </div>
              </div>
            );
          })()}

          {gameState.gamePhase === 'interaction' && (
            <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-6 text-center">
              <h2 className="text-2xl font-bold text-teal-300 mb-4">💬 Passenger Interaction</h2>
              <div className="bg-gray-700/50 p-4 rounded-lg mb-6">
                <p className="text-gray-200 italic text-lg">"{gameState.currentDialogue?.text}"</p>
              </div>
              <button
                onClick={onContinueToDestination}
                className="bg-teal-600 hover:bg-teal-500 py-3 px-6 rounded-lg font-semibold transition-colors"
              >
                Continue to Destination
              </button>
            </div>
          )}

          {gameState.gamePhase === 'dropOff' && gameState.lastRideCompletion && (
            <DropOffState
              gameState={gameState}
              completedPassenger={gameState.lastRideCompletion.passenger}
              fareEarned={gameState.lastRideCompletion.fareEarned}
              itemsReceived={gameState.lastRideCompletion.itemsReceived}
              backstoryUnlocked={gameState.lastRideCompletion.backstoryUnlocked}
              onContinue={onContinueFromDropOff || (() => { })}
            />
          )}
        </div>
      </div>

      {/* Advanced Inventory Modal */}
      <InventoryModal
        isOpen={showInventory}
        onClose={() => setShowInventory(false)}
        inventory={gameState.inventory}
        gameState={gameState}
        onUseItem={onUseItem}
        onTradeItem={onTradeItem}
        currentPassenger={gameState.currentPassenger}
      />
    </div>
  );
};

export default GameScreen;
