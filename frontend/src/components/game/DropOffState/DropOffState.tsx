import React from 'react';
import type { GameState, Passenger, InventoryItem } from '../../../types/game';
import Portrait from '../../common/Portrait/Portrait';
import styles from './DropOffState.module.css';

interface DropOffStateProps {
  gameState: GameState;
  completedPassenger: Passenger;
  fareEarned: number;
  itemsReceived: InventoryItem[];
  backstoryUnlocked?: {
    passenger: string;
    backstory: string;
  };
  onContinue: () => void;
}

export const DropOffState: React.FC<DropOffStateProps> = ({
  gameState,
  completedPassenger,
  fareEarned,
  itemsReceived,
  backstoryUnlocked,
  onContinue,
}) => {
  const getRideQualityText = () => {
    if (fareEarned >= completedPassenger.fare + 5) return '⭐⭐⭐ Exceptional Service';
    if (fareEarned >= completedPassenger.fare) return '⭐⭐ Good Service';
    if (fareEarned >= completedPassenger.fare - 5) return '⭐ Adequate Service';
    return '⚠️ Poor Service';
  };

  const getRideQualityClass = () => {
    if (fareEarned >= completedPassenger.fare + 5) return styles.excellent;
    if (fareEarned >= completedPassenger.fare) return styles.good;
    if (fareEarned >= completedPassenger.fare - 5) return styles.adequate;
    return styles.poor;
  };

  return (
    <div className={styles.dropOffContainer}>
      {/* Compact Header with Continue Button */}
      <div className={styles.compactHeader}>
        <div className={styles.rideInfo}>
          <h2 className={styles.title}>🏁 Ride Completed</h2>
          <p className={styles.destination}>Arrived at {completedPassenger.destination}</p>
        </div>
        <button onClick={onContinue} className={styles.continueButton}>
          Continue Driving
        </button>
      </div>

      {/* Main Content in Two Columns */}
      <div className={styles.mainLayout}>
        {/* Left Column: Passenger & Status */}
        <div className={styles.leftColumn}>
          {/* Passenger Feedback */}
          <div className={styles.passengerFeedback}>
            <div className={styles.passengerInfo}>
              <Portrait
                passengerName={completedPassenger.name}
                emoji={completedPassenger.emoji}
                size="small"
              />
              <div>
                <h3 className={styles.passengerName}>{completedPassenger.name}</h3>
                <p className={styles.fareInfo}>
                  Expected: ${completedPassenger.fare} • Earned: ${fareEarned}
                </p>
                <div className={`${styles.serviceRating} ${getRideQualityClass()}`}>
                  {getRideQualityText()}
                </div>
              </div>
            </div>
          </div>

          {/* Current Status */}
          <div className={styles.statusGrid}>
            <div className={styles.statusItem}>
              <span className={styles.statusIcon}>💰</span>
              <div className={styles.statusInfo}>
                <span className={styles.statusValue}>${gameState.earnings}</span>
                <span className={styles.statusLabel}>Total Earnings</span>
              </div>
            </div>
            <div className={styles.statusItem}>
              <span className={styles.statusIcon}>🚗</span>
              <div className={styles.statusInfo}>
                <span className={styles.statusValue}>{gameState.ridesCompleted}</span>
                <span className={styles.statusLabel}>Rides Completed</span>
              </div>
            </div>
            <div className={styles.statusItem}>
              <span className={styles.statusIcon}>⛽</span>
              <div className={styles.statusInfo}>
                <span className={styles.statusValue}>{Number(gameState.fuel.toFixed(1))}%</span>
                <span className={styles.statusLabel}>Fuel Remaining</span>
              </div>
            </div>
            <div className={styles.statusItem}>
              <span className={styles.statusIcon}>⏰</span>
              <div className={styles.statusInfo}>
                <span className={styles.statusValue}>{Math.floor(gameState.timeRemaining)}</span>
                <span className={styles.statusLabel}>Minutes Left</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Items & Backstory */}
        <div className={styles.rightColumn}>
          {/* Items Received Section */}
          {itemsReceived.length > 0 && (
            <div className={styles.itemsSection}>
              <h3 className={styles.sectionTitle}>📦 Items Found</h3>
              <div className={styles.itemsList}>
                {itemsReceived.map((item, index) => (
                  <div key={index} className={styles.compactItemCard}>
                    <div className={styles.itemHeader}>
                      <span className={styles.itemEmoji}>📦</span>
                      <span className={styles.itemName}>{item.name}</span>
                    </div>
                    <p className={styles.itemDescription}>{item.description}</p>
                    {item.cursedProperties && (
                      <div className={styles.cursedWarning}>⚠️ Unsettling</div>
                    )}
                    {item.protectiveProperties && (
                      <div className={styles.protectiveInfo}>
                        🛡️ Protective ({item.protectiveProperties.usesRemaining} uses)
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Backstory Section */}
          {backstoryUnlocked && (
            <div className={styles.backstorySection}>
              <h3 className={styles.sectionTitle}>📚 Lore Discovered</h3>
              <div className={styles.backstoryCard}>
                <h4 className={styles.backstoryTitle}>{backstoryUnlocked.passenger}'s Secret</h4>
                <p className={styles.backstoryText}>{backstoryUnlocked.backstory}</p>
                <div className={styles.loreNote}>
                  <span className={styles.loreIcon}>✨</span>
                  New lore entry added
                </div>
              </div>
            </div>
          )}

          {/* No Special Items Message */}
          {itemsReceived.length === 0 && !backstoryUnlocked && (
            <div className={styles.noExtrasSection}>
              <p className={styles.noExtrasText}>
                The passenger gathered their belongings and left without a trace...
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom hint */}
      <div className={styles.continueHint}>The night continues... more passengers await</div>
    </div>
  );
};

export default DropOffState;
