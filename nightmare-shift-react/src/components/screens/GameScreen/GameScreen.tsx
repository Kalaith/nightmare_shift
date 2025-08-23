import React, { useState } from 'react';
import type { GameState } from '../../../types/game';
import { RouteService } from '../../../services/reputationService';
import { gameData } from '../../../data/gameData';

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
  onGameOver
}) => {
  const [showQuickRules, setShowQuickRules] = useState(false);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
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
        <div className="flex flex-wrap items-center justify-between gap-4">
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
            <div className="text-center py-12">
              <h2 className="text-3xl font-bold text-teal-300 mb-4">🚗 Waiting for passengers...</h2>
              <p className="text-gray-300 mb-6">Your taxi is parked under a flickering streetlight</p>
              <button 
                onClick={() => setShowInventory(!showInventory)}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition-colors"
              >
                🎒 Inventory ({gameState.inventory.length})
              </button>
            </div>
          )}

          {gameState.gamePhase === 'rideRequest' && gameState.currentPassenger && (
            <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-teal-300 mb-4">📱 New Ride Request</h2>
              <div className="flex items-start gap-4 mb-6">
                <span className="text-4xl">{gameState.currentPassenger.emoji}</span>
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
              gameData.locations.find(loc => loc.name === gameState.currentPassenger?.pickup)?.riskLevel || 1 : 1;
            const routeOptions = RouteService.getRouteOptions(gameState.fuel, gameState.timeRemaining, passengerRiskLevel);
            
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
        </div>
      </div>

      {/* Inventory Modal */}
      {showInventory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 border border-gray-600 rounded-lg max-w-md w-full max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-600">
              <h3 className="text-xl font-semibold text-teal-300">🎒 Inventory</h3>
              <button 
                onClick={() => setShowInventory(false)}
                className="text-gray-400 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              {gameState.inventory.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No items collected yet</p>
              ) : (
                <div className="space-y-3">
                  {gameState.inventory.map((item, index) => (
                    <div key={index} className="bg-gray-700/50 p-3 rounded">
                      <strong className="text-white">{item.name}</strong>
                      <p className="text-gray-400 text-sm">Left by: {item.source}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameScreen;
