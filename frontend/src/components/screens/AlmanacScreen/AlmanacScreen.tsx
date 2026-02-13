import React from "react";
import { ALMANAC_LEVELS, LORE_COSTS } from "../../../data/almanacData";
import type { PlayerStats, Passenger, AlmanacEntry } from "../../../types/game";

interface AlmanacScreenProps {
  playerStats: PlayerStats;
  allPassengers: Passenger[];
  onUpgradeKnowledge: (passengerId: number) => void;
  onBack: () => void;
}

const AlmanacScreen: React.FC<AlmanacScreenProps> = ({
  playerStats,
  allPassengers,
  onUpgradeKnowledge,
  onBack,
}) => {
  const [selectedPassenger, setSelectedPassenger] =
    React.useState<Passenger | null>(null);

  const getAlmanacEntry = (passengerId: number): AlmanacEntry => {
    return (
      (playerStats.almanacProgress || {})[passengerId] || {
        passengerId,
        encountered: false,
        knowledgeLevel: 0,
        unlockedSecrets: [],
      }
    );
  };

  const getUpgradeCost = (currentLevel: 0 | 1 | 2 | 3): number => {
    if (currentLevel === 0) return LORE_COSTS.UNLOCK_LEVEL_1;
    if (currentLevel === 1) return LORE_COSTS.UNLOCK_LEVEL_2;
    if (currentLevel === 2) return LORE_COSTS.UNLOCK_LEVEL_3;
    return 0;
  };

  const canUpgrade = (entry: AlmanacEntry): boolean => {
    if (!entry.encountered) return false;
    if (entry.knowledgeLevel >= 3) return false;
    const cost = getUpgradeCost(entry.knowledgeLevel);
    return playerStats.loreFragments >= cost;
  };

  const encounteredPassengers = allPassengers.filter(
    (p) => getAlmanacEntry(p.id).encountered,
  );

  const renderPassengerCard = (passenger: Passenger) => {
    const entry = getAlmanacEntry(passenger.id);
    const level = ALMANAC_LEVELS[entry.knowledgeLevel];

    return (
      <div
        key={passenger.id}
        onClick={() => setSelectedPassenger(passenger)}
        className={`
          p-4 rounded-lg border-2 cursor-pointer transition-all
          ${entry.encountered ? "bg-gray-800 border-gray-600" : "bg-gray-900 border-gray-700 opacity-50"}
          ${selectedPassenger?.id === passenger.id ? "ring-2 ring-purple-400" : ""}
          hover:border-purple-500
        `}
      >
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{passenger.emoji}</span>
          <div className="flex-1">
            <h4 className="text-white font-semibold">
              {entry.encountered ? passenger.name : "???"}
            </h4>
            <p className="text-xs text-gray-500">{level.name}</p>
          </div>
        </div>
        {entry.encountered && (
          <div className="flex gap-1 mt-2">
            {[0, 1, 2, 3].map((lvl) => (
              <div
                key={lvl}
                className={`h-1 flex-1 rounded ${
                  lvl < entry.knowledgeLevel ? "bg-purple-500" : "bg-gray-700"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const selectedEntry = selectedPassenger
    ? getAlmanacEntry(selectedPassenger.id)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-slate-950 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-purple-300 mb-2">Almanac</h1>
            <p className="text-gray-400">Knowledge of the supernatural</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Lore Fragments</div>
            <div className="text-3xl font-bold text-purple-400">
              {playerStats.loreFragments}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Passenger List */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-semibold text-white mb-4">
              Entities ({encounteredPassengers.length}/{allPassengers.length})
            </h2>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {allPassengers.map(renderPassengerCard)}
            </div>
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-2">
            {selectedPassenger && selectedEntry ? (
              <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
                <div className="flex items-start gap-4 mb-6">
                  <span className="text-6xl">{selectedPassenger.emoji}</span>
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-white mb-2">
                      {selectedEntry.encountered
                        ? selectedPassenger.name
                        : "Unknown Entity"}
                    </h2>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          selectedEntry.knowledgeLevel === 0
                            ? "bg-gray-700 text-gray-400"
                            : selectedEntry.knowledgeLevel === 1
                              ? "bg-blue-900 text-blue-300"
                              : selectedEntry.knowledgeLevel === 2
                                ? "bg-purple-900 text-purple-300"
                                : "bg-yellow-900 text-yellow-300"
                        }`}
                      >
                        {ALMANAC_LEVELS[selectedEntry.knowledgeLevel].name}
                      </span>
                      <span className="text-gray-400 text-sm">
                        Level {selectedEntry.knowledgeLevel}/3
                      </span>
                    </div>
                  </div>
                </div>

                {!selectedEntry.encountered ? (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-lg">
                      You have not encountered this entity yet.
                    </p>
                    <p className="text-sm mt-2">
                      Complete rides to discover new passengers.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Level 1: Basic Info */}
                    {selectedEntry.knowledgeLevel >= 1 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-blue-300 mb-2">
                          Basic Information
                        </h3>
                        <p className="text-gray-300 mb-2">
                          {selectedPassenger.description}
                        </p>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div>
                            <span className="text-gray-400 text-sm">
                              Pickup:
                            </span>
                            <div className="text-white">
                              {selectedPassenger.pickup}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-400 text-sm">
                              Destination:
                            </span>
                            <div className="text-white">
                              {selectedPassenger.destination}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Level 2: Route Preferences */}
                    {selectedEntry.knowledgeLevel >= 2 &&
                      selectedPassenger.routePreferences && (
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold text-purple-300 mb-2">
                            Route Preferences
                          </h3>
                          <div className="space-y-2">
                            {selectedPassenger.routePreferences.map(
                              (pref, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between bg-gray-900 p-3 rounded"
                                >
                                  <div>
                                    <span className="text-white capitalize">
                                      {pref.route}
                                    </span>
                                    <p className="text-sm text-gray-400">
                                      {pref.reason}
                                    </p>
                                  </div>
                                  <span
                                    className={`px-2 py-1 rounded text-sm ${
                                      pref.preference === "loves"
                                        ? "bg-green-900 text-green-300"
                                        : pref.preference === "likes"
                                          ? "bg-blue-900 text-blue-300"
                                          : pref.preference === "dislikes"
                                            ? "bg-orange-900 text-orange-300"
                                            : pref.preference === "fears"
                                              ? "bg-red-900 text-red-300"
                                              : "bg-gray-700 text-gray-300"
                                    }`}
                                  >
                                    {pref.preference}
                                  </span>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                    {/* Level 3: Backstory & Secrets */}
                    {selectedEntry.knowledgeLevel >= 3 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-yellow-300 mb-2">
                          True Nature
                        </h3>
                        <div className="bg-gray-900 p-4 rounded mb-3">
                          <p className="text-gray-300 italic">
                            {selectedPassenger.backstoryDetails}
                          </p>
                        </div>
                        <div className="bg-red-900/20 border border-red-700 p-3 rounded">
                          <span className="text-red-400 font-semibold">
                            Personal Rule:{" "}
                          </span>
                          <span className="text-gray-300">
                            {selectedPassenger.personalRule}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Upgrade Button */}
                    {selectedEntry.knowledgeLevel < 3 && (
                      <button
                        onClick={() =>
                          canUpgrade(selectedEntry) &&
                          onUpgradeKnowledge(selectedPassenger.id)
                        }
                        disabled={!canUpgrade(selectedEntry)}
                        className={`
                          w-full py-3 px-6 rounded-lg font-semibold text-lg transition-colors
                          ${
                            canUpgrade(selectedEntry)
                              ? "bg-purple-500 hover:bg-purple-600 text-white cursor-pointer"
                              : "bg-gray-700 text-gray-500 cursor-not-allowed"
                          }
                        `}
                      >
                        {canUpgrade(selectedEntry)
                          ? `Upgrade to ${ALMANAC_LEVELS[(selectedEntry.knowledgeLevel + 1) as 1 | 2 | 3].name} (${getUpgradeCost(selectedEntry.knowledgeLevel)} Lore)`
                          : selectedEntry.knowledgeLevel >= 3
                            ? "Fully Mastered"
                            : `Need ${getUpgradeCost(selectedEntry.knowledgeLevel)} Lore Fragments`}
                      </button>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="bg-gray-800 border border-gray-600 rounded-lg p-12 text-center text-gray-500">
                <p className="text-lg">Select an entity to view details</p>
              </div>
            )}
          </div>
        </div>

        {/* Back Button */}
        <button
          onClick={onBack}
          className="w-full mt-6 bg-gray-700 hover:bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold transition-colors"
        >
          ← Back to Main Menu
        </button>
      </div>
    </div>
  );
};

export default AlmanacScreen;
