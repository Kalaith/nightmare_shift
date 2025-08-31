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
  onContinue
}) => {
  const getRideQualityText = () => {
    if (fareEarned >= completedPassenger.fare + 5) return "⭐⭐⭐ Exceptional Service";
    if (fareEarned >= completedPassenger.fare) return "⭐⭐ Good Service";
    if (fareEarned >= completedPassenger.fare - 5) return "⭐ Adequate Service";
    return "⚠️ Poor Service";
  };

  const getRideQualityClass = () => {
    if (fareEarned >= completedPassenger.fare + 5) return styles.excellent;
    if (fareEarned >= completedPassenger.fare) return styles.good;
    if (fareEarned >= completedPassenger.fare - 5) return styles.adequate;
    return styles.poor;
  };

  return (
    <div className={styles.dropOffContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>🏁 Ride Completed</h2>
        <p className={styles.destination}>
          Arrived at {completedPassenger.destination}
        </p>
      </div>

      {/* Passenger Feedback */}
      <div className={styles.passengerFeedback}>
        <div className={styles.passengerInfo}>
          <Portrait 
            passengerName={completedPassenger.name}
            emoji={completedPassenger.emoji}
            size="medium"
          />
          <div>
            <h3 className={styles.passengerName}>{completedPassenger.name}</h3>
            <p className={styles.fareInfo}>
              Expected: ${completedPassenger.fare} • Earned: ${fareEarned}
            </p>
          </div>
        </div>
        
        <div className={`${styles.serviceRating} ${getRideQualityClass()}`}>
          {getRideQualityText()}
        </div>
      </div>

      {/* Items Received Section */}
      {itemsReceived.length > 0 && (
        <div className={styles.itemsSection}>
          <h3 className={styles.sectionTitle}>📦 Items Found</h3>
          <div className={styles.itemsGrid}>
            {itemsReceived.map((item, index) => (
              <div key={index} className={styles.itemCard}>
                <div className={styles.itemHeader}>
                  <span className={styles.itemEmoji}>{item.emoji}</span>
                  <span className={styles.itemName}>{item.name}</span>
                </div>
                <p className={styles.itemDescription}>{item.description}</p>
                {item.cursedProperties && (
                  <div className={styles.cursedWarning}>
                    ⚠️ This item feels... unsettling
                  </div>
                )}
                {item.protectiveProperties && (
                  <div className={styles.protectiveInfo}>
                    🛡️ Protective item ({item.protectiveProperties.usesRemaining} uses)
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
            <h4 className={styles.backstoryTitle}>
              {backstoryUnlocked.passenger}'s Secret
            </h4>
            <p className={styles.backstoryText}>
              {backstoryUnlocked.backstory}
            </p>
            <div className={styles.loreNote}>
              <span className={styles.loreIcon}>✨</span>
              New lore entry added to your collection
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
            <span className={styles.statusValue}>{gameState.fuel}%</span>
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

      {/* Continue Button */}
      <div className={styles.continueSection}>
        <p className={styles.continueHint}>
          The night continues... more passengers await
        </p>
        <button 
          onClick={onContinue}
          className={styles.continueButton}
        >
          Continue Driving
        </button>
      </div>
    </div>
  );
};

export default DropOffState;