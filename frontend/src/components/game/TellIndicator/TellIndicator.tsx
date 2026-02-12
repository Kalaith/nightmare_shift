import React, { useState, useEffect } from 'react';
import type { PassengerTell, DetectedTell, Passenger } from '../../../types/game';
import styles from './TellIndicator.module.css';

interface TellIndicatorProps {
  detectedTells: DetectedTell[];
  passenger: Passenger;
  isActive: boolean;
  playerTrust: number;
  onTellClicked?: (tell: DetectedTell) => void;
}

export const TellIndicator: React.FC<TellIndicatorProps> = ({
  detectedTells,
  passenger: _passenger,
  isActive,
  playerTrust,
  onTellClicked
}) => {
  const [visibleTells, setVisibleTells] = useState<DetectedTell[]>([]);
  const [animatingTells, setAnimatingTells] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!isActive) {
      setVisibleTells([]);
      return;
    }

    // Gradually reveal tells based on player's perception skill
    const revealTells = () => {
      const sortedTells = [...detectedTells].sort((a, b) => {
        // Show obvious tells first, then moderate, then subtle
        const intensityOrder = { obvious: 0, moderate: 1, subtle: 2 };
        return intensityOrder[a.tell.intensity] - intensityOrder[b.tell.intensity];
      });

      sortedTells.forEach((tell, index) => {
        const baseDelay = index * 800; // Stagger reveals
        const perceptionDelay = tell.playerNoticed ? 0 : 2000; // Delay unnoticed tells
        
        setTimeout(() => {
          setVisibleTells(prev => {
            if (!prev.some(t => t.detectionTime === tell.detectionTime)) {
              setAnimatingTells(prev => new Set(prev).add(tell.detectionTime));
              
              // Remove animation flag after animation completes
              setTimeout(() => {
                setAnimatingTells(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(tell.detectionTime);
                  return newSet;
                });
              }, 600);

              return [...prev, tell];
            }
            return prev;
          });
        }, baseDelay + perceptionDelay);
      });
    };

    revealTells();
  }, [detectedTells, isActive, playerTrust]);

  const getTellIcon = (tell: PassengerTell) => {
    const typeIcons = {
      verbal: '💬',
      behavioral: '🎭',
      visual: '👁️',
      environmental: '🌫️'
    };
    
    const intensityIcons = {
      obvious: '🔴',
      moderate: '🟡', 
      subtle: '🔵'
    };

    return {
      type: typeIcons[tell.type],
      intensity: intensityIcons[tell.intensity]
    };
  };

  const getTellReliabilityColor = (reliability: number) => {
    if (reliability >= 0.8) return styles.reliabilityHigh;
    if (reliability >= 0.6) return styles.reliabilityMedium;
    return styles.reliabilityLow;
  };

  const getPlayerNoticeStatus = (detected: DetectedTell) => {
    if (detected.playerNoticed) {
      return { icon: '✓', className: styles.noticed, text: 'Noticed' };
    } else {
      return { icon: '?', className: styles.missed, text: 'Missed' };
    }
  };

  const handleTellClick = (tell: DetectedTell) => {
    if (onTellClicked) {
      onTellClicked(tell);
    }
  };

  if (!isActive || visibleTells.length === 0) {
    return (
      <div className={styles.emptyState}>
        <span className={styles.emptyIcon}>👁️‍🗨️</span>
        <span className={styles.emptyText}>Observing passenger...</span>
      </div>
    );
  }

  return (
    <div className={styles.tellContainer}>
      <div className={styles.header}>
        <h4 className={styles.title}>
          <span className={styles.titleIcon}>🔍</span>
          What You Notice
        </h4>
        <div className={styles.trustLevel}>
          <span className={styles.trustLabel}>Perception:</span>
          <div className={styles.trustBar}>
            <div 
              className={styles.trustFill}
              style={{ width: `${playerTrust * 100}%` }}
            />
          </div>
          <span className={styles.trustValue}>{Math.round(playerTrust * 100)}%</span>
        </div>
      </div>

      <div className={styles.tellsList}>
        {visibleTells.map((detectedTell) => {
          const icons = getTellIcon(detectedTell.tell);
          const reliability = getTellReliabilityColor(detectedTell.tell.reliability);
          const noticeStatus = getPlayerNoticeStatus(detectedTell);
          const isAnimating = animatingTells.has(detectedTell.detectionTime);
          
          return (
            <div
              key={detectedTell.detectionTime}
              className={`
                ${styles.tellItem} 
                ${styles[`intensity${detectedTell.tell.intensity}`]}
                ${isAnimating ? styles.animating : ''}
                ${!detectedTell.playerNoticed ? styles.faded : ''}
              `}
              onClick={() => handleTellClick(detectedTell)}
              role="button"
              tabIndex={0}
            >
              <div className={styles.tellIcons}>
                <span className={styles.typeIcon} title={detectedTell.tell.type}>
                  {icons.type}
                </span>
                <span className={styles.intensityIcon} title={detectedTell.tell.intensity}>
                  {icons.intensity}
                </span>
              </div>

              <div className={styles.tellContent}>
                <div className={styles.tellDescription}>
                  {detectedTell.tell.description}
                </div>

                {detectedTell.tell.triggerPhrase && (
                  <div className={styles.tellPhrase}>
                    "{detectedTell.tell.triggerPhrase}"
                  </div>
                )}

                <div className={styles.tellMeta}>
                  <span className={styles.tellType}>
                    {detectedTell.tell.type}
                  </span>
                  <span className={styles.separator}>•</span>
                  <span className={`${styles.reliability} ${reliability}`}>
                    {Math.round(detectedTell.tell.reliability * 100)}% reliable
                  </span>
                  <span className={styles.separator}>•</span>
                  <span className={`${styles.noticeStatus} ${noticeStatus.className}`}>
                    {noticeStatus.icon} {noticeStatus.text}
                  </span>
                </div>
              </div>

              <div className={styles.tellStatus}>
                {detectedTell.exceptionId && (
                  <span className={styles.exceptionIndicator} title="This tell suggests an exception">
                    ⚠️
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className={styles.summary}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Total Tells:</span>
          <span className={styles.summaryValue}>{visibleTells.length}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Noticed:</span>
          <span className={styles.summaryValue}>
            {visibleTells.filter(t => t.playerNoticed).length}
          </span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Exceptions:</span>
          <span className={styles.summaryValue}>
            {visibleTells.filter(t => t.exceptionId).length}
          </span>
        </div>
      </div>
    </div>
  );
};
