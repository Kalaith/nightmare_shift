import React, { useState } from 'react';
import { SaveGameService } from '../../../services/storageService';
import type { PlayerStats } from '../../../types/game';
import type { AuthUser } from '../../../hooks/useAuthSession';
import bannerImg from '../../../assets/banner.png';

interface LoadingScreenProps {
  playerStats: PlayerStats;
  user: AuthUser | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  onContinueAsGuest: () => Promise<void>;
  linkAccountUrl: string;
  onStartGame: () => void;
  onLoadGame: () => void;
  onShowLeaderboard: () => void;
  onShowSkillTree: () => void;
  onShowAlmanac: () => void;
  onShowAdmin?: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  playerStats,
  user,
  isAuthenticated,
  authLoading,
  onContinueAsGuest,
  linkAccountUrl,
  onStartGame,
  onLoadGame,
  onShowLeaderboard,
  onShowSkillTree,
  onShowAlmanac,
  onShowAdmin,
}) => {
  const hasSavedGame = SaveGameService.hasSavedGame();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleStartGame = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    onStartGame();
  };

  const handleLoadGame = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    onLoadGame();
  };

  const loginUrl = import.meta.env.VITE_WEB_HATCHERY_LOGIN_URL || '/login';
  const effectiveLoginUrl = user?.is_guest ? linkAccountUrl : loginUrl;
  const isAdminUser =
    !!user &&
    (user.is_admin === true ||
      (typeof user.role === 'string' && user.role.toLowerCase() === 'admin') ||
      (Array.isArray(user.roles) && user.roles.some(role => String(role).toLowerCase() === 'admin')));

  return (
    <div className="min-h-screen p-5 flex flex-col bg-gradient-to-b from-gray-800 to-slate-900 relative">
      <div className="text-center mb-8">
        <img
          src={bannerImg}
          alt="Nightmare Shift Banner"
          className="w-full max-w-md mx-auto rounded-lg shadow-lg mb-4"
        />
        <h1 className="text-4xl font-bold text-teal-300 mb-2 drop-shadow-lg">Nightmare Shift</h1>
        <p className="text-lg text-gray-300">
          Drive the supernatural. Follow the rules. Survive the shift.
        </p>
      </div>

      <div className="bg-gray-800/80 border border-gray-600 rounded-lg px-4 py-3 mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">Driver</span>
          {authLoading ? (
            <span className="text-gray-400 text-sm animate-pulse">Connecting...</span>
          ) : isAuthenticated && user ? (
            <div>
              <span className="text-white font-semibold">{user.display_name || user.username}</span>
              <span className="text-gray-400 text-xs ml-2">{user.is_guest ? '• Guest Session' : '• Online'}</span>
            </div>
          ) : (
            <span className="text-red-400 text-sm">Not signed in</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {!isAuthenticated && !authLoading ? (
            <button
              onClick={() => void onContinueAsGuest()}
              className="text-xs px-3 py-2 rounded-md bg-teal-700 hover:bg-teal-600 text-white transition-colors"
            >
              Continue as Guest
            </button>
          ) : null}
          {user?.is_guest ? (
            <a
              href={effectiveLoginUrl}
              className="text-xs px-3 py-2 rounded-md bg-amber-600 hover:bg-amber-500 text-gray-950 font-semibold transition-colors"
            >
              Link Account
            </a>
          ) : null}
          {isAuthenticated ? <span className="text-green-400 text-xs">Authenticated</span> : null}
        </div>
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
        <p className="text-gray-200">Connecting to dispatch...</p>
        <p className="text-gray-400 text-sm italic">Start new shift</p>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleStartGame}
          className="w-full bg-teal-300 text-gray-800 py-3 px-5 rounded-lg text-lg font-medium hover:bg-teal-400 transition-colors"
        >
          Start New Shift
        </button>

        {hasSavedGame && (
          <button
            onClick={handleLoadGame}
            className="w-full bg-green-600 text-white py-3 px-5 rounded-lg text-lg font-medium hover:bg-green-500 transition-colors"
          >
            Continue Saved Shift
          </button>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onShowSkillTree}
            className="bg-teal-700 text-white py-2 px-4 rounded-lg text-sm hover:bg-teal-600 transition-colors"
          >
            Skills
          </button>
          <button
            onClick={onShowAlmanac}
            className="bg-purple-700 text-white py-2 px-4 rounded-lg text-sm hover:bg-purple-600 transition-colors"
          >
            Almanac
          </button>
        </div>

        <button
          onClick={onShowLeaderboard}
          className="w-full bg-gray-700 text-gray-200 py-2 px-5 rounded-lg text-sm hover:bg-gray-600 transition-colors"
        >
          View Leaderboard
        </button>

        {isAdminUser && onShowAdmin ? (
          <button
            onClick={onShowAdmin}
            className="w-full bg-amber-700 text-white py-2 px-5 rounded-lg text-sm hover:bg-amber-600 transition-colors"
          >
            Admin Sessions
          </button>
        ) : null}

        <div className="pt-4 border-t border-gray-700 mt-4">
          <button
            onClick={() => {
              if (
                window.confirm(
                  'This will wipe local cache and reset in-browser progress for this device. Continue?'
                )
              ) {
                localStorage.clear();
                window.location.reload();
              }
            }}
            className="w-full bg-red-900/50 text-red-400 py-2 px-5 rounded-lg text-xs hover:bg-red-900 hover:text-red-300 transition-colors border border-red-800/50"
          >
            Clear Cache
          </button>
        </div>
      </div>

      {showLoginModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-8 max-w-md w-full text-center shadow-2xl">
            <h2 className="text-3xl font-bold text-teal-300 mb-4">Choose Session</h2>
            <p className="text-gray-300 mb-8 text-lg">
              Start with a guest driver now, or sign in to attach your progress to your WebHatchery account.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowLoginModal(false)}
                className="px-6 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-semibold transition-colors border border-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLoginModal(false);
                  void onContinueAsGuest();
                }}
                className="px-6 py-3 rounded-lg bg-gray-200 hover:bg-white text-gray-900 font-semibold transition-colors border border-gray-300"
              >
                Continue as Guest
              </button>
              <a
                href={effectiveLoginUrl}
                className="px-6 py-3 rounded-lg bg-teal-500 hover:bg-teal-400 text-gray-900 font-bold transition-colors shadow-lg shadow-teal-500/20"
              >
                Log In
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoadingScreen;
