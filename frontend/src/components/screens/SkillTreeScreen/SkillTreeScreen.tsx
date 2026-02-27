import React, { useState, useEffect } from 'react';
import type { PlayerStats, Skill } from '../../../types/game';
import { gameApi } from '../../../api/gameApi';

interface SkillTreeScreenProps {
  playerStats: PlayerStats;
  onPurchaseSkill: (skillId: string) => void;
  onBack: () => void;
}

const SkillTreeScreen: React.FC<SkillTreeScreenProps> = ({
  playerStats,
  onPurchaseSkill,
  onBack,
}) => {
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchSkills = async () => {
      try {
        const data = await gameApi.getSkills();
        if (mounted) {
          setSkills(data);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (mounted) {
          const message = err instanceof Error ? err.message : 'Failed to load skills';
          setError(message);
          setLoading(false);
        }
      }
    };
    fetchSkills();
    return () => {
      mounted = false;
    };
  }, []);

  const canAfford = (skill: Skill) => (playerStats.bankBalance || 0) >= skill.cost;

  const hasPrerequisites = (skill: Skill) => {
    return skill.prerequisites.every(prereqId =>
      (playerStats.unlockedSkills || []).includes(prereqId)
    );
  };

  const isUnlocked = (skill: Skill) => (playerStats.unlockedSkills || []).includes(skill.id);

  const canPurchase = (skill: Skill) => {
    return !isUnlocked(skill) && canAfford(skill) && hasPrerequisites(skill);
  };

  const skillsByCategory = {
    survival: skills.filter(s => s.category === 'survival'),
    occult: skills.filter(s => s.category === 'occult'),
    efficiency: skills.filter(s => s.category === 'efficiency'),
  };

  const renderSkill = (skill: Skill) => {
    const unlocked = isUnlocked(skill);
    const affordable = canAfford(skill);
    const hasPrereqs = hasPrerequisites(skill);

    return (
      <div
        key={skill.id}
        onClick={() => setSelectedSkill(skill)}
        className={`
          p-4 rounded-lg border-2 cursor-pointer transition-all
          ${unlocked ? 'bg-teal-900/30 border-teal-400' : 'bg-gray-800 border-gray-600'}
          ${!hasPrereqs ? 'opacity-40' : ''}
          ${selectedSkill?.id === skill.id ? 'ring-2 ring-teal-300' : ''}
          hover:border-teal-500
        `}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl">{skill.icon}</span>
          {unlocked && <span className="text-teal-400 text-sm">✓ Unlocked</span>}
        </div>
        <h4 className="text-white font-semibold mb-1">{skill.name}</h4>
        <p className="text-gray-400 text-sm mb-2">{skill.description}</p>
        <div className="flex items-center justify-between">
          <span className={`text-sm font-bold ${affordable ? 'text-green-400' : 'text-red-400'}`}>
            ${skill.cost}
          </span>
          {skill.prerequisites.length > 0 && (
            <span className="text-xs text-gray-500">
              Requires: {skill.prerequisites.length} skill
              {skill.prerequisites.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-slate-950 p-6 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-gray-700 border-t-teal-400 rounded-full animate-spin mb-4"></div>
        <p className="text-teal-400 font-semibold animate-pulse">Loading skill tree...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-slate-950 p-6 flex flex-col items-center justify-center">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 max-w-md text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-2">Error</h2>
          <p className="text-red-200 mb-6">{error}</p>
          <button
            onClick={onBack}
            className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-600 transition-colors"
          >
            ← Return to Main Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-slate-950 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-teal-300 mb-2">Skill Tree</h1>
            <p className="text-gray-400">Permanent upgrades for your taxi</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Bank Balance</div>
            <div className="text-3xl font-bold text-green-400">${playerStats.bankBalance}</div>
          </div>
        </div>

        {/* Skill Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Survival Branch */}
          <div>
            <h2 className="text-2xl font-semibold text-blue-400 mb-4 flex items-center gap-2">
              <span>🛡️</span> Survival
            </h2>
            <div className="space-y-3">{skillsByCategory.survival.map(renderSkill)}</div>
          </div>

          {/* Occult Branch */}
          <div>
            <h2 className="text-2xl font-semibold text-purple-400 mb-4 flex items-center gap-2">
              <span>👁️</span> Occult
            </h2>
            <div className="space-y-3">{skillsByCategory.occult.map(renderSkill)}</div>
          </div>

          {/* Efficiency Branch */}
          <div>
            <h2 className="text-2xl font-semibold text-yellow-400 mb-4 flex items-center gap-2">
              <span>💰</span> Efficiency
            </h2>
            <div className="space-y-3">{skillsByCategory.efficiency.map(renderSkill)}</div>
          </div>
        </div>

        {/* Selected Skill Detail Panel */}
        {selectedSkill && (
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <span className="text-5xl">{selectedSkill.icon}</span>
                <div>
                  <h3 className="text-2xl font-bold text-white">{selectedSkill.name}</h3>
                  <p className="text-gray-400">{selectedSkill.description}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSkill(null)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <span className="text-gray-400 text-sm">Cost:</span>
                <div className="text-2xl font-bold text-green-400">${selectedSkill.cost}</div>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Category:</span>
                <div className="text-lg capitalize text-white">{selectedSkill.category}</div>
              </div>
            </div>

            {selectedSkill.prerequisites.length > 0 && (
              <div className="mb-4">
                <span className="text-gray-400 text-sm">Prerequisites:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedSkill.prerequisites.map(prereqId => {
                    const prereq = skills.find(s => s.id === prereqId);
                    const unlocked = (playerStats.unlockedSkills || []).includes(prereqId);
                    return (
                      <span
                        key={prereqId}
                        className={`px-3 py-1 rounded-full text-sm ${unlocked ? 'bg-teal-900 text-teal-300' : 'bg-gray-700 text-gray-400'
                          }`}
                      >
                        {unlocked ? '✓' : '🔒'} {prereq?.name || prereqId}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              onClick={() => canPurchase(selectedSkill) && onPurchaseSkill(selectedSkill.id)}
              disabled={!canPurchase(selectedSkill)}
              className={`
                w-full py-3 px-6 rounded-lg font-semibold text-lg transition-colors
                ${canPurchase(selectedSkill)
                  ? 'bg-teal-500 hover:bg-teal-600 text-white cursor-pointer'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              {isUnlocked(selectedSkill)
                ? 'Already Unlocked'
                : !hasPrerequisites(selectedSkill)
                  ? 'Missing Prerequisites'
                  : !canAfford(selectedSkill)
                    ? 'Insufficient Funds'
                    : 'Purchase Skill'}
            </button>
          </div>
        )}

        {/* Back Button */}
        <button
          onClick={onBack}
          className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold transition-colors"
        >
          ← Back to Main Menu
        </button>
      </div>
    </div>
  );
};

export default SkillTreeScreen;
