import { useState } from 'react';
import './LeaderboardScreen.module.css';

const LeaderboardScreen = ({ leaderboard, onBack }) => {
  const [activeTab, setActiveTab] = useState('earnings');
  
  const getLeaderboardData = () => {
    switch (activeTab) {
      case 'earnings': return leaderboard.topEarnings || [];
      case 'rides': return leaderboard.topRides || [];
      case 'survival': return leaderboard.topSurvivalTime || [];
      case 'overall': return leaderboard.topOverall || [];
      default: return [];
    }
  };
  
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString();
  };
  
  return (
    <div className="min-h-screen p-5 flex flex-col bg-gradient-to-b from-gray-800 to-slate-900">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-semibold text-teal-300 mb-2">🏆 Night Shift Leaderboard</h2>
        <p className="text-gray-300">Top performing drivers in the supernatural district</p>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex space-x-2 mb-6 bg-gray-800 p-2 rounded-lg">
        {[
          { key: 'earnings', label: 'Top Earnings', icon: '💰' },
          { key: 'rides', label: 'Most Rides', icon: '🚗' },
          { key: 'survival', label: 'Longest Shifts', icon: '🕐' },
          { key: 'overall', label: 'Best Overall', icon: '⭐' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
              activeTab === tab.key 
                ? 'bg-teal-300 text-gray-800' 
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Leaderboard Content */}
      <div className="flex-1 mb-6">
        <div className="bg-gray-800 border border-gray-600 rounded-lg overflow-hidden">
          {getLeaderboardData().length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <p className="text-4xl mb-4">👻</p>
              <p>No shifts completed yet...</p>
              <p className="text-sm">Complete a shift to see your scores here!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {getLeaderboardData().map((entry, index) => (
                <div key={index} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-yellow-400 text-gray-900' :
                      index === 1 ? 'bg-gray-400 text-gray-900' :
                      index === 2 ? 'bg-orange-400 text-gray-900' :
                      'bg-gray-700 text-gray-300'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-gray-200 font-medium">
                        {activeTab === 'earnings' && `$${entry.earnings}`}
                        {activeTab === 'rides' && `${entry.ridesCompleted} rides`}
                        {activeTab === 'survival' && `${entry.timeSpent} minutes`}
                        {activeTab === 'overall' && `${Math.round(entry.score)} points`}
                      </div>
                      <div className="text-gray-400 text-sm">
                        {entry.successful ? '✅ Survived' : '💀 Failed'} • 
                        Difficulty {entry.difficultyLevel || 0} • 
                        {formatDate(entry.timestamp)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-400">
                    <div>${entry.earnings} • {entry.ridesCompleted} rides</div>
                    <div>{entry.timeSpent}min • {entry.rulesViolated || 0} violations</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Back Button */}
      <button 
        onClick={onBack}
        className="w-full bg-gray-700 text-gray-200 py-3 px-5 rounded-lg font-medium hover:bg-gray-600 transition-colors"
      >
        ← Back to Menu
      </button>
    </div>
  );
};

export default LeaderboardScreen;