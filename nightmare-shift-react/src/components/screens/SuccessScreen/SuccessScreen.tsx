import React from 'react';

interface SuccessScreenProps {
  gameState: any;
  onStartNextShift: () => void;
  onShowLeaderboard: () => void;
  onShowMainMenu: () => void;
}

const SuccessScreen: React.FC<SuccessScreenProps> = ({ 
  gameState, 
  onStartNextShift, 
  onShowLeaderboard, 
  onShowMainMenu 
}) => {
  return (
    <div className="min-h-screen p-5 flex items-center justify-center bg-gradient-to-b from-gray-800 to-slate-900">
      <div className="text-center max-w-md mx-auto py-8">
        <h2 className="text-3xl font-semibold text-teal-300 mb-6">Shift Complete</h2>
        <p className="text-teal-300 text-lg mb-6">You survived the night and completed your shift!</p>
        
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-5 mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-400">Total Rides:</span>
            <span className="text-gray-200">{gameState.ridesCompleted}</span>
          </div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-400">Total Earnings:</span>
            <span className="text-gray-200">${gameState.earnings}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Bonus:</span>
            <span className="text-gray-200">${gameState.survivalBonus || 50}</span>
          </div>
        </div>
        
        {gameState.inventory && gameState.inventory.length > 0 && (
          <div className="mb-6">
            <h4 className="text-teal-300 mb-3">Items Found:</h4>
            {gameState.inventory.map((item: any, index: number) => (
              <p key={index} className="text-gray-300">• {item.name} (from {item.source})</p>
            ))}
          </div>
        )}
        
        <div className="space-y-3">
          <button 
            onClick={onStartNextShift}
            className="w-full bg-teal-300 text-gray-800 py-3 px-5 rounded-lg text-lg font-medium hover:bg-teal-400 transition-colors"
          >
            Start Next Shift
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

export default SuccessScreen
