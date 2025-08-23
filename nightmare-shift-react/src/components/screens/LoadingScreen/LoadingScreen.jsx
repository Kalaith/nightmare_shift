import { SaveGameService } from '../../../services/storageService.js';
import './LoadingScreen.module.css';

const LoadingScreen = ({ 
  playerStats, 
  onStartGame, 
  onLoadGame, 
  onShowLeaderboard 
}) => {
  const hasSavedGame = SaveGameService.hasSavedGame();

  return (
    <div className="min-h-screen p-5 flex flex-col bg-gradient-to-b from-gray-800 to-slate-900">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-teal-300 mb-2 drop-shadow-lg">🚗 NightShift</h1>
        <p className="text-lg text-gray-300">Professional Night Transportation</p>
      </div>
      
      {/* Player Stats Summary */}
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 mb-6">
        <h3 className="text-teal-300 text-lg mb-3">Driver Record</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Shifts Completed:</span>
            <span className="text-gray-200">{playerStats.totalShiftsCompleted}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Total Earnings:</span>
            <span className="text-gray-200">${playerStats.totalEarnings}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Best Shift:</span>
            <span className="text-gray-200">${playerStats.bestShiftEarnings}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Max Rides:</span>
            <span className="text-gray-200">{playerStats.bestShiftRides}</span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col justify-center items-center gap-6">
        <div className="w-15 h-15 border-3 border-gray-600 border-t-teal-300 rounded-full animate-spin"></div>
        <p className="text-gray-200">Connecting to dispatch...</p>
      </div>
      
      <div className="space-y-3">
        <button 
          onClick={onStartGame}
          className="w-full bg-teal-300 text-gray-800 py-3 px-5 rounded-lg text-lg font-medium hover:bg-teal-400 transition-colors"
        >
          Start New Shift
        </button>
        
        {hasSavedGame && (
          <button 
            onClick={onLoadGame}
            className="w-full bg-green-600 text-white py-3 px-5 rounded-lg text-lg font-medium hover:bg-green-500 transition-colors"
          >
            💾 Continue Saved Shift
          </button>
        )}
        
        <button 
          onClick={onShowLeaderboard}
          className="w-full bg-gray-700 text-gray-200 py-2 px-5 rounded-lg text-sm hover:bg-gray-600 transition-colors"
        >
          📊 View Leaderboard
        </button>
      </div>
    </div>
  );
};

export default LoadingScreen;