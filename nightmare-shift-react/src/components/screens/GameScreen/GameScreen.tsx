import React, { useState } from 'react';
import type { GameState, Passenger } from '../../../types/game';
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
            <div className={`px-3 py-1 rounded ${
              gameState.earnings >= gameState.minimumEarnings 
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
              onRefuelFull={onRefuelFull || (() => {})}
              onRefuelPartial={onRefuelPartial || (() => {})}
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
            const routeOptionsResult = RouteService.getRouteOptions(gameState.fuel, gameState.timeRemaining, passengerRiskLevel);
            const routeOptions = GameResultHelpers.unwrapOr(routeOptionsResult, []);
            
            // If we got an error but have a fallback, show an error message
            if (!routeOptionsResult.success && routeOptions.length === 0) {
              return (
                <div className="bg-red-800/50 border border-red-600 rounded-lg p-6 text-center">
                  <h2 className="text-2xl font-bold text-red-300 mb-4">⚠️ Route Error</h2>
                  <p className="text-gray-300 mb-4">Unable to calculate route options. Try ending your shift.</p>
                  <button 
                    onClick={() => onGameOver('Route calculation failed')}
                    className="bg-red-600 hover:bg-red-500 py-2 px-4 rounded transition-colors"
                  >
                    End Shift
                  </button>
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
                      className={`p-4 rounded-lg font-semibold transition-colors text-left ${
                        !route.available 
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50' 
                          : route.type === 'normal'
                            ? 'bg-blue-600 hover:bg-blue-500 text-white'
                            : route.type === 'shortcut' 
                              ? 'bg-orange-600 hover:bg-orange-500 text-white'
                              : route.type === 'scenic'
                                ? 'bg-green-600 hover:bg-green-500 text-white' 
                                : 'bg-purple-600 hover:bg-purple-500 text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-lg font-bold">{route.name}</div>
                          <div className="text-sm opacity-90">{route.description}</div>
                          {route.bonusInfo && (
                            <div className="text-xs mt-1 font-semibold text-yellow-300">{route.bonusInfo}</div>
                          )}
                        </div>
                        <div className="text-right text-sm">
                          <div>⛽ -{route.fuelCost} fuel</div>
                          <div>⏰ -{route.timeCost} min</div>
                          <div>⚠️ Risk: {route.riskLevel}</div>
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
                <p className="text-gray-200 italic text-lg">"{gameState.currentDialogue}"</p>
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
              onContinue={onContinueFromDropOff || (() => {})}
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
