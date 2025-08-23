import React from 'react';
import type { GameState } from '../../../types/game';

interface GameOverScreenProps {
  gameState: GameState;
  onTryAgain: () => void;
  onShowLeaderboard: () => void;
  onShowMainMenu: () => void;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({ 
  gameState, 
  onTryAgain, 
  onShowLeaderboard, 
  onShowMainMenu 
}) => {
  return (
    <div className="min-h-screen p-5 flex items-center justify-center bg-gradient-to-b from-gray-800 to-slate-900">
      <div className="text-center max-w-md mx-auto py-8">
        <h2 className="text-3xl font-semibold text-red-400 mb-6">Shift Terminated</h2>
        
        <div className="bg-red-400/10 border border-red-400/30 rounded p-5 mb-6 text-red-400">
          <p>{gameState.gameOverReason}</p>
        </div>
        
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-5 mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-400">Rides Completed:</span>
            <span className="text-gray-200">{gameState.ridesCompleted}</span>
          </div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-400">Earnings:</span>
            <span className="text-gray-200">${gameState.earnings}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Rules Violated:</span>
            <span className="text-gray-200">{gameState.rulesViolated}</span>
          </div>
        </div>
        
        <div className="space-y-3">
          <button 
            onClick={onTryAgain}
            className="w-full bg-teal-300 text-gray-800 py-3 px-5 rounded-lg text-lg font-medium hover:bg-teal-400 transition-colors"
          >
            Try Another Shift
          </button>
          
          <div className="flex gap-3">
            <button 
              onClick={onShowLeaderboard}
              className="flex-1 bg-gray-700 text-gray-200 py-2 px-4 rounded-lg text-sm hover:bg-gray-600 transition-colors"
            >
              📊 Leaderboard
            </button>
            <button 
              onClick={onShowMainMenu}
              className="flex-1 bg-gray-700 text-gray-200 py-2 px-4 rounded-lg text-sm hover:bg-gray-600 transition-colors"
            >
              🏠 Main Menu
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GameOverScreen
