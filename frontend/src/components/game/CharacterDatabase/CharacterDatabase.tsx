import React, { useState, useEffect } from 'react';
import type { Passenger, GameState } from '../../../types/game';
import { gameData } from '../../../data/gameData';
import Portrait from '../../common/Portrait/Portrait';
import styles from './CharacterDatabase.module.css';

interface CharacterDatabaseProps {
  gameState: GameState;
  isVisible: boolean;
  onClose: () => void;
}

interface CharacterEntry {
  passenger: Passenger;
  isUnlocked: boolean;
  encounterCount: number;
  lastEncounter?: number;
  backstoryUnlocked: boolean;
  relationshipsRevealed: number[];
  guidelinesTriggered: string[];
  trustLevel: 'unknown' | 'hostile' | 'neutral' | 'friendly' | 'trusted';
}

export const CharacterDatabase: React.FC<CharacterDatabaseProps> = ({
  gameState,
  isVisible,
  onClose
}) => {
  const [characters, setCharacters] = useState<Map<number, CharacterEntry>>(new Map());
  const [selectedCharacter, setSelectedCharacter] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'encountered' | 'backstory' | 'mysterious'>('encountered');
  const [sortBy, setSortBy] = useState<'name' | 'encounters' | 'rarity' | 'trust'>('encounters');

  useEffect(() => {
    if (!isVisible) return;

    // Build character database from game state and passenger data
    const characterMap = new Map<number, CharacterEntry>();

    gameData.passengers.forEach((passenger: Passenger) => {
      const reputation = gameState.passengerReputation?.[passenger.id];
      const isUnlocked = (gameState.usedPassengers || []).includes(passenger.id);
      const backstoryUnlocked = gameState.passengerBackstories?.[passenger.id] || false;

      characterMap.set(passenger.id, {
        passenger,
        isUnlocked,
        encounterCount: reputation?.interactions || 0,
        lastEncounter: reputation?.lastEncounter,
        backstoryUnlocked,
        relationshipsRevealed: [], // TODO: Track relationship discoveries
        guidelinesTriggered: passenger.guidelineExceptions || [],
        trustLevel: reputation?.relationshipLevel || 'unknown'
      });
    });

    setCharacters(characterMap);
  }, [gameState, isVisible]);

  const getFilteredCharacters = (): CharacterEntry[] => {
    const allCharacters = Array.from(characters.values());

    switch (filterType) {
      case 'encountered':
        return allCharacters.filter(entry => entry.isUnlocked);
      case 'backstory':
        return allCharacters.filter(entry => entry.backstoryUnlocked);
      case 'mysterious':
        return allCharacters.filter(entry => entry.isUnlocked && !entry.backstoryUnlocked);
      default:
        return allCharacters;
    }
  };

  const getSortedCharacters = (filtered: CharacterEntry[]): CharacterEntry[] => {
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.passenger.name.localeCompare(b.passenger.name);
        case 'encounters':
          return b.encounterCount - a.encounterCount;
        case 'rarity':
          const rarityOrder = { 'legendary': 4, 'rare': 3, 'uncommon': 2, 'common': 1 };
          return rarityOrder[b.passenger.rarity] - rarityOrder[a.passenger.rarity];
        case 'trust':
          const trustOrder = { 'trusted': 5, 'friendly': 4, 'neutral': 3, 'hostile': 2, 'unknown': 1 };
          return trustOrder[b.trustLevel] - trustOrder[a.trustLevel];
        default:
          return 0;
      }
    });
  };

  const getUnlockProgress = (): { total: number; unlocked: number; backstories: number } => {
    const total = gameData.passengers.length;
    const unlocked = Array.from(characters.values()).filter(entry => entry.isUnlocked).length;
    const backstories = Array.from(characters.values()).filter(entry => entry.backstoryUnlocked).length;
    return { total, unlocked, backstories };
  };

  const getTrustLevelIcon = (trustLevel: CharacterEntry['trustLevel']) => {
    switch (trustLevel) {
      case 'trusted': return '💚';
      case 'friendly': return '🟢';
      case 'neutral': return '🟡';
      case 'hostile': return '🔴';
      default: return '❓';
    }
  };

  const getRarityColor = (rarity: Passenger['rarity']) => {
    switch (rarity) {
      case 'legendary': return styles.rarityLegendary;
      case 'rare': return styles.rarityRare;
      case 'uncommon': return styles.rarityUncommon;
      default: return styles.rarityCommon;
    }
  };

  if (!isVisible) return null;

  const filtered = getFilteredCharacters();
  const sorted = getSortedCharacters(filtered);
  const progress = getUnlockProgress();
  const selectedEntry = selectedCharacter ? characters.get(selectedCharacter) : null;

  return (
    <div className={styles.databaseContainer}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h2 className={styles.title}>
            <span className={styles.titleIcon}>📚</span>
            Character Database
          </h2>
          <button onClick={onClose} className={styles.closeButton}>
            ✕
          </button>
        </div>

        <div className={styles.progressBar}>
          <div className={styles.progressSection}>
            <span className={styles.progressLabel}>Encountered:</span>
            <div className={styles.progressTrack}>
              <div
                className={styles.progressFill}
                style={{ width: `${(progress.unlocked / progress.total) * 100}%` }}
              />
            </div>
            <span className={styles.progressText}>{progress.unlocked}/{progress.total}</span>
          </div>

          <div className={styles.progressSection}>
            <span className={styles.progressLabel}>Backstories:</span>
            <div className={styles.progressTrack}>
              <div
                className={`${styles.progressFill} ${styles.backstoryProgress}`}
                style={{ width: `${(progress.backstories / progress.unlocked) * 100}%` }}
              />
            </div>
            <span className={styles.progressText}>{progress.backstories}/{progress.unlocked}</span>
          </div>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.filters}>
          <span className={styles.filterLabel}>Filter:</span>
          {(['all', 'encountered', 'backstory', 'mysterious'] as const).map(filter => (
            <button
              key={filter}
              onClick={() => setFilterType(filter)}
              className={`${styles.filterButton} ${filterType === filter ? styles.active : ''}`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
              <span className={styles.filterCount}>
                ({filter === 'all' ? progress.total :
                  filter === 'encountered' ? progress.unlocked :
                    filter === 'backstory' ? progress.backstories :
                      progress.unlocked - progress.backstories})
              </span>
            </button>
          ))}
        </div>

        <div className={styles.sorting}>
          <span className={styles.sortLabel}>Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className={styles.sortSelect}
          >
            <option value="encounters">Encounters</option>
            <option value="name">Name</option>
            <option value="rarity">Rarity</option>
            <option value="trust">Trust Level</option>
          </select>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.characterList}>
          {sorted.map(entry => (
            <div
              key={entry.passenger.id}
              onClick={() => setSelectedCharacter(entry.passenger.id)}
              className={`
                ${styles.characterCard} 
                ${selectedCharacter === entry.passenger.id ? styles.selected : ''}
                ${!entry.isUnlocked ? styles.locked : ''}
              `}
            >
              <div className={styles.cardHeader}>
                {entry.isUnlocked ? (
                  <Portrait
                    passengerName={entry.passenger.name}
                    emoji={entry.passenger.emoji}
                    size="medium"
                    className={styles.characterEmoji}
                  />
                ) : (
                  <span className={styles.characterEmoji}>❓</span>
                )}
                <div className={styles.cardInfo}>
                  <h4 className={styles.characterName}>
                    {entry.isUnlocked ? entry.passenger.name : 'Unknown'}
                  </h4>
                  <div className={styles.cardMeta}>
                    <span className={`${styles.rarity} ${getRarityColor(entry.passenger.rarity)}`}>
                      {entry.isUnlocked ? entry.passenger.rarity : '???'}
                    </span>
                    <span className={styles.trustLevel}>
                      {getTrustLevelIcon(entry.trustLevel)}
                    </span>
                  </div>
                </div>
              </div>

              {entry.isUnlocked && (
                <div className={styles.cardStats}>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>Encounters:</span>
                    <span className={styles.statValue}>{entry.encounterCount}</span>
                  </div>
                  {entry.backstoryUnlocked && (
                    <div className={styles.backstoryIndicator}>
                      <span className={styles.backstoryIcon}>📖</span>
                      <span className={styles.backstoryText}>Story Unlocked</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {selectedEntry && (
          <div className={styles.characterDetails}>
            {selectedEntry.isUnlocked ? (
              <>
                <div className={styles.detailsHeader}>
                  <Portrait
                    passengerName={selectedEntry.passenger.name}
                    emoji={selectedEntry.passenger.emoji}
                    size="large"
                    className={styles.detailsEmoji}
                  />
                  <div className={styles.detailsInfo}>
                    <h3 className={styles.detailsName}>{selectedEntry.passenger.name}</h3>
                    <p className={styles.detailsDescription}>{selectedEntry.passenger.description}</p>
                  </div>
                </div>

                <div className={styles.detailsContent}>
                  <div className={styles.detailsSection}>
                    <h4 className={styles.sectionTitle}>📊 Statistics</h4>
                    <div className={styles.statGrid}>
                      <div className={styles.statItem}>
                        <span className={styles.statLabel}>Supernatural Type:</span>
                        <span className={styles.statValue}>{selectedEntry.passenger.supernatural}</span>
                      </div>
                      <div className={styles.statItem}>
                        <span className={styles.statLabel}>Encounters:</span>
                        <span className={styles.statValue}>{selectedEntry.encounterCount}</span>
                      </div>
                      <div className={styles.statItem}>
                        <span className={styles.statLabel}>Trust Level:</span>
                        <span className={styles.statValue}>
                          {getTrustLevelIcon(selectedEntry.trustLevel)} {selectedEntry.trustLevel}
                        </span>
                      </div>
                      <div className={styles.statItem}>
                        <span className={styles.statLabel}>Typical Fare:</span>
                        <span className={styles.statValue}>${selectedEntry.passenger.fare}</span>
                      </div>
                    </div>
                  </div>

                  {selectedEntry.backstoryUnlocked && (
                    <div className={styles.detailsSection}>
                      <h4 className={styles.sectionTitle}>📖 Backstory</h4>
                      <p className={styles.backstoryText}>
                        {selectedEntry.passenger.backstoryDetails}
                      </p>
                    </div>
                  )}

                  <div className={styles.detailsSection}>
                    <h4 className={styles.sectionTitle}>🎭 Behavioral Notes</h4>
                    <p className={styles.personalRule}>{selectedEntry.passenger.personalRule}</p>
                    {selectedEntry.guidelinesTriggered.length > 0 && (
                      <div className={styles.guidelineList}>
                        <span className={styles.guidelineLabel}>Associated Guidelines:</span>
                        {selectedEntry.guidelinesTriggered.map((guideline, index) => (
                          <span key={index} className={styles.guidelineTag}>
                            {guideline.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className={styles.lockedDetails}>
                <div className={styles.lockedIcon}>🔒</div>
                <h3 className={styles.lockedTitle}>Character Locked</h3>
                <p className={styles.lockedDescription}>
                  Encounter this passenger during your night shifts to unlock their information.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};