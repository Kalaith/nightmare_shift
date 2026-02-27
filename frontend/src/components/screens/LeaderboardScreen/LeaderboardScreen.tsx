import React, { useState, useEffect } from 'react';
import { gameApi } from '../../../api/gameApi';
import type { LeaderboardEntry } from '../../../types/game';

interface LeaderboardScreenProps {
  onBack: () => void;
}

const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ onBack }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    gameApi.getLeaderboard(20)
      .then(setEntries)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load leaderboard'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen p-5 bg-gradient-to-b from-gray-800 to-slate-900 text-white">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-teal-300 drop-shadow-lg">
            🏆 Global Leaderboard
          </h1>
          <button
            onClick={onBack}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
          >
            ← Back to Menu
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">Loading leaderboard...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400 text-lg">Failed to load leaderboard</p>
            <p className="text-gray-500 text-sm mt-2">{error}</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No games completed yet</p>
            <p className="text-gray-500 text-sm mt-2">
              Complete a shift to appear on the leaderboard!
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {entries.map((entry, index) => (
                <div
                  key={entry.id ?? `${entry.playedAt ?? entry.date}-${index}`}
                  className="bg-gray-800/50 border border-gray-600 rounded-lg p-4 flex items-center gap-4"
                >
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${index === 0
                        ? 'bg-yellow-500 text-gray-900'
                        : index === 1
                          ? 'bg-gray-400 text-gray-900'
                          : index === 2
                            ? 'bg-orange-600 text-white'
                            : 'bg-gray-600 text-gray-300'
                      }`}
                  >
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-2xl font-bold text-teal-300">
                          {entry.score.toLocaleString()} pts
                        </span>
                        {entry.username && (
                          <span className="ml-3 text-gray-400 text-sm">
                            by {entry.username}
                          </span>
                        )}
                      </div>
                      <div className="text-right text-sm text-gray-400">
                        {entry.playedAt ?? entry.date}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-300">
                      <span className={entry.survived ? 'text-green-400' : 'text-red-400'}>
                        {entry.survived ? '✅ Survived' : '💀 Failed'}
                      </span>
                      <span>🚗 {entry.passengersTransported} rides</span>
                      <span>⚡ Level {entry.difficultyLevel}</span>
                      <span>⚠️ {entry.rulesViolated} violations</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center text-gray-400 text-sm">
              <p>Showing top {entries.length} results across all players</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LeaderboardScreen;
