import React from 'react';
import type { GameState } from '../../../types/game';
import { GAME_BALANCE } from '../../../constants/gameBalance';
import styles from './WaitingState.module.css';

interface WaitingStateProps {
  gameState: GameState;
  showInventory: boolean;
  onToggleInventory: () => void;
  onRefuelFull: () => void;
  onRefuelPartial: () => void;
  onRequestRide: () => void;
}

export const WaitingState: React.FC<WaitingStateProps> = ({
  gameState,
  showInventory: _showInventory,
  onToggleInventory,
  onRefuelFull,
  onRefuelPartial,
  onRequestRide,
}) => {
  const fuelPercentage = Number(gameState.fuel.toFixed(1));
  const isLowFuel = fuelPercentage <= GAME_BALANCE.FUEL_THRESHOLDS.LOW_FUEL_WARNING;
  const isCriticalFuel = fuelPercentage <= GAME_BALANCE.FUEL_THRESHOLDS.CRITICAL_FUEL;

  // Fuel costs
  const fuelNeeded = Number((100 - fuelPercentage).toFixed(1));
  const fullRefuelCost = Math.ceil(fuelNeeded * 0.5); // $0.50 per fuel %
  const partialRefuelCost = Math.ceil(25 * 0.5); // Refuel 25% for $12-13

  const canAffordFull = gameState.earnings >= fullRefuelCost && fuelPercentage < 100;
  const canAffordPartial = gameState.earnings >= partialRefuelCost && fuelPercentage < 75;

  const getFuelStatusText = () => {
    if (isCriticalFuel) return '⚠️ CRITICAL FUEL LEVEL';
    if (isLowFuel) return '🔴 Low Fuel Warning';
    if (fuelPercentage <= 50) return '🟡 Fuel Getting Low';
    return '🟢 Fuel Level Good';
  };

  const getFuelBarColor = () => {
    if (isCriticalFuel) return styles.fuelCritical;
    if (isLowFuel) return styles.fuelLow;
    if (fuelPercentage <= 50) return styles.fuelMedium;
    return styles.fuelGood;
  };

  return (
    <div className={styles.waitingContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>🚗 Waiting for passengers...</h2>
        <p className={styles.description}>
          Your taxi is parked under a flickering streetlight.
          {isLowFuel && ' You notice the fuel gauge is getting low...'}
        </p>
      </div>

      {/* Fuel Status Display */}
      <div className={`${styles.fuelStatus} ${isCriticalFuel ? styles.fuelStatusCritical : ''}`}>
        <div className={styles.fuelHeader}>
          <span className={styles.fuelLabel}>{getFuelStatusText()}</span>
          <span className={styles.fuelValue}>{fuelPercentage}%</span>
        </div>

        <div className={styles.fuelBarContainer}>
          <div
            className={`${styles.fuelBar} ${getFuelBarColor()}`}
            style={{ width: `${fuelPercentage}%` }}
          />
        </div>

        {isCriticalFuel && (
          <p className={styles.fuelWarning}>
            ⚠️ You need fuel soon or you won't be able to complete rides!
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className={styles.actionGrid}>
        <button
          onClick={onRequestRide}
          className={styles.inventoryButton}
          title="Look for the next fare"
        >
          <span className={styles.buttonIcon}>🚕</span>
          <span className={styles.buttonText}>Request Next Ride</span>
        </button>

        {/* Inventory Button */}
        <button
          onClick={onToggleInventory}
          className={styles.inventoryButton}
          title="View collected items"
        >
          <span className={styles.buttonIcon}>🎒</span>
          <span className={styles.buttonText}>Inventory ({gameState.inventory.length})</span>
        </button>

        {/* Fuel Buttons */}
        {fuelPercentage < 100 && (
          <div className={styles.fuelSection}>
            <h3 className={styles.sectionTitle}>⛽ Gas Station Options</h3>

            <button
              onClick={onRefuelFull}
              disabled={!canAffordFull}
              className={`${styles.fuelButton} ${styles.fullRefuel}`}
              title={canAffordFull ? `Fill tank completely` : `Need $${fullRefuelCost} to refuel`}
            >
              <span className={styles.buttonIcon}>🏁</span>
              <div className={styles.fuelButtonContent}>
                <span className={styles.buttonText}>Full Tank</span>
                <span className={styles.buttonDetails}>
                  +{fuelNeeded}% fuel • ${fullRefuelCost}
                </span>
                {!canAffordFull && (
                  <span className={styles.buttonDisabled}>Need ${fullRefuelCost}</span>
                )}
              </div>
            </button>

            {fuelPercentage <= 75 && (
              <button
                onClick={onRefuelPartial}
                disabled={!canAffordPartial}
                className={`${styles.fuelButton} ${styles.partialRefuel}`}
                title={canAffordPartial ? `Add 25% fuel` : `Need $${partialRefuelCost} to refuel`}
              >
                <span className={styles.buttonIcon}>⛽</span>
                <div className={styles.fuelButtonContent}>
                  <span className={styles.buttonText}>Quick Fill</span>
                  <span className={styles.buttonDetails}>+25% fuel • ${partialRefuelCost}</span>
                  {!canAffordPartial && (
                    <span className={styles.buttonDisabled}>Need ${partialRefuelCost}</span>
                  )}
                </div>
              </button>
            )}
          </div>
        )}

        {/* Fuel Full Message */}
        {fuelPercentage === 100 && (
          <div className={styles.fuelFullMessage}>
            <span className={styles.fuelFullIcon}>✅</span>
            <span className={styles.fuelFullText}>Tank is full - ready for the night!</span>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className={styles.tips}>
        <h4 className={styles.tipsTitle}>💡 Night Shift Tips</h4>
        <ul className={styles.tipsList}>
          <li>Keep fuel above 20% to avoid running out during rides</li>
          <li>Weather conditions can increase fuel consumption</li>
          <li>Check your inventory for useful items between passengers</li>
          {gameState.environmentalHazards.length > 0 && (
            <li className={styles.hazardTip}>
              ⚠️ Environmental hazards are active - fuel costs may be higher
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default WaitingState;
