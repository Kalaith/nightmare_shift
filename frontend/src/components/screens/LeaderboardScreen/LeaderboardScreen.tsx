import React from "react";
import type { LeaderboardEntry } from "../../../types/game";

interface LeaderboardScreenProps {
  leaderboard: LeaderboardEntry[];
  onBack: () => void;
}

const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({
  leaderboard = [],
  onBack,
}) => {
  const safeLeaderboard = Array.isArray(leaderboard) ? leaderboard : [];

  return (
    <div className="min-h-screen p-5 bg-gradient-to-b from-gray-800 to-slate-900 text-white">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-teal-300 drop-shadow-lg">
            🏆 Personal Leaderboard
          </h1>
          <button
            onClick={onBack}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
          >
            ← Back to Menu
          </button>
        </div>

        <div className="space-y-4">
          {safeLeaderboard.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No games completed yet</p>
              <p className="text-gray-500 text-sm mt-2">
                Complete a shift to appear on the leaderboard!
              </p>
            </div>
          ) : (
            safeLeaderboard.map((entry, index) => (
              <div
                key={`${entry.date}-${index}`}
                className="bg-gray-800/50 border border-gray-600 rounded-lg p-4 flex items-center gap-4"
              >
                <div
                  className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${
                    index === 0
                      ? "bg-yellow-500 text-gray-900"
                      : index === 1
                        ? "bg-gray-400 text-gray-900"
                        : index === 2
                          ? "bg-orange-600 text-white"
                          : "bg-gray-600 text-gray-300"
                  }`}
                >
                  #{index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-2xl font-bold text-teal-300">
                      {entry.score.toLocaleString()} pts
                    </div>
                    <div className="text-right text-sm text-gray-400">
                      {entry.date}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-300">
                    <span
                      className={
                        entry.survived ? "text-green-400" : "text-red-400"
                      }
                    >
                      {entry.survived ? "✅ Survived" : "💀 Failed"}
                    </span>
                    <span>🚗 {entry.passengersTransported} rides</span>
                    <span>⚡ Level {entry.difficultyLevel}</span>
                    <span>⚠️ {entry.rulesViolated} violations</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {safeLeaderboard.length > 0 && (
          <div className="mt-8 text-center text-gray-400 text-sm">
            <p>Showing top {Math.min(safeLeaderboard.length, 10)} results</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardScreen;
