import React from 'react';
import { SaveGameService } from '../../../services/storageService';
import type { PlayerStats } from '../../../types/game';
import bannerImg from '../../../assets/banner.png';

interface LoadingScreenProps {
  playerStats: PlayerStats;
  onStartGame: () => void;
  onLoadGame: () => void;
  onShowLeaderboard: () => void;
  onShowSkillTree: () => void;
  onShowAlmanac: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  playerStats,
  onStartGame,
  onLoadGame,
  onShowLeaderboard,
  onShowSkillTree,
  onShowAlmanac
}) => {
  const hasSavedGame = SaveGameService.hasSavedGame();

  return (
    <div className="min-h-screen p-5 flex flex-col bg-gradient-to-b from-gray-800 to-slate-900">
      <div className="text-center mb-8">
        <img src={bannerImg} alt="Nightmare Shift Banner" className="w-full max-w-md mx-auto rounded-lg shadow-lg mb-4" />
        <h1 className="text-4xl font-bold text-teal-300 mb-2 drop-shadow-lg">🚗 Nightmare Shift</h1>
        <p className="text-lg text-gray-300">Drive the supernatural. Follow the rules. Survive the shift.</p>
      </div>

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
          <div className="flex justify-between">
            <span className="text-gray-400">Bank Balance:</span>
            <span className="text-green-400 font-semibold">${playerStats.bankBalance}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Lore Fragments:</span>
            <span className="text-purple-400 font-semibold">{playerStats.loreFragments}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center gap-6">
        <div className="w-15 h-15 border-3 border-gray-600 border-t-teal-300 rounded-full animate-spin"></div>
        <p className="text-gray-200">Connecting to dispatch...</p>
        <p className="text-gray-400 text-sm italic">Start new shift</p>
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

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onShowSkillTree}
            className="bg-teal-700 text-white py-2 px-4 rounded-lg text-sm hover:bg-teal-600 transition-colors"
          >
            🌳 Skills
          </button>
          <button
            onClick={onShowAlmanac}
            className="bg-purple-700 text-white py-2 px-4 rounded-lg text-sm hover:bg-purple-600 transition-colors"
          >
            📖 Almanac
          </button>
        </div>

        <button
          onClick={onShowLeaderboard}
          className="w-full bg-gray-700 text-gray-200 py-2 px-5 rounded-lg text-sm hover:bg-gray-600 transition-colors"
        >
          📊 View Leaderboard
        </button>
      </div>
    </div>
  )
}

export default LoadingScreen
