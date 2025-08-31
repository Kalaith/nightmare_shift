import React, { useState, useEffect } from 'react';
import type { GameState, Passenger, DetectedTell } from '../../../types/game';
import { GuidelineEngine } from '../../../services/guidelineEngine';
import styles from './TensionMeter.module.css';

interface TensionMeterProps {
  gameState: GameState;
  passenger?: Passenger;
  detectedTells?: DetectedTell[];
  currentDecision?: {
    type: 'pending' | 'made' | 'none';
    confidence?: number;
    timeRemaining?: number;
  };
  isVisible: boolean;
}

interface TensionFactors {
  passengerDeception: number;
  tellConflict: number;
  timePresssure: number;
  playerUncertainty: number;
  environmentalStress: number;
  overallTension: number;
}

export const TensionMeter: React.FC<TensionMeterProps> = ({
  gameState,
  passenger,
  detectedTells = [],
  currentDecision,
  isVisible
}) => {
  const [tensionFactors, setTensionFactors] = useState<TensionFactors>({
    passengerDeception: 0,
    tellConflict: 0,
    timePresssure: 0,
    playerUncertainty: 0,
    environmentalStress: 0,
    overallTension: 0
  });

  const [doubtLevel, setDoubtLevel] = useState(0);
  const [confidenceLevel, setConfidenceLevel] = useState(0.5);
  const [stressIndicators, setStressIndicators] = useState<string[]>([]);

  useEffect(() => {
    if (!isVisible || !passenger) return;

    const factors = calculateTensionFactors();
    setTensionFactors(factors);
    updatePsychologicalState(factors);
    updateStressIndicators(factors);
  }, [gameState, passenger, detectedTells, currentDecision, isVisible]);

  const calculateTensionFactors = (): TensionFactors => {
    if (!passenger) return {
      passengerDeception: 0,
      tellConflict: 0,
      timePresssure: 0,
      playerUncertainty: 0,
      environmentalStress: 0,
      overallTension: 0
    };

    // Passenger deception factor
    const deceptionLevel = passenger.deceptionLevel || 0;
    const passengerDeception = Math.min(1, deceptionLevel + (passenger.stressLevel || 0) * 0.3);

    // Tell conflict factor
    const obviousTells = detectedTells.filter(t => t.tell.intensity === 'obvious');
    const subtleTells = detectedTells.filter(t => t.tell.intensity === 'subtle');
    const missedTells = detectedTells.filter(t => !t.playerNoticed);
    const conflictingTells = obviousTells.length > 0 && subtleTells.length > 0;
    const tellConflict = conflictingTells ? 0.8 : (missedTells.length / Math.max(1, detectedTells.length)) * 0.6;

    // Time pressure factor
    let timePresssure = 0;
    if (currentDecision?.type === 'pending' && currentDecision.timeRemaining !== undefined) {
      timePresssure = Math.max(0, (30 - currentDecision.timeRemaining) / 30);
    }

    // Player uncertainty factor (based on reading difficulty)
    const readingDifficulty = GuidelineEngine.calculateReadingDifficulty(passenger, gameState);
    const playerTrust = gameState.playerTrust || 0;
    const playerUncertainty = readingDifficulty * (1 - playerTrust);

    // Environmental stress factor
    const environmentalStress = calculateEnvironmentalStress();

    // Overall tension (weighted average)
    const overallTension = Math.min(1, 
      passengerDeception * 0.25 +
      tellConflict * 0.25 +
      timePresssure * 0.2 +
      playerUncertainty * 0.2 +
      environmentalStress * 0.1
    );

    return {
      passengerDeception,
      tellConflict,
      timePresssure,
      playerUncertainty,
      environmentalStress,
      overallTension
    };
  };

  const calculateEnvironmentalStress = (): number => {
    let stress = 0;
    
    // Weather conditions
    if (gameState.currentWeather) {
      switch (gameState.currentWeather.type) {
        case 'thunderstorm':
          stress += 0.4;
          break;
        case 'fog':
          stress += 0.3;
          break;
        case 'rain':
          stress += 0.2;
          break;
      }
    }

    // Time of day
    if (gameState.timeOfDay?.phase === 'latenight') {
      stress += 0.3;
    }

    // Fuel level
    if (gameState.fuel < 10) {
      stress += 0.2;
    }

    // Time remaining in shift
    if (gameState.timeRemaining < 60) {
      stress += 0.2;
    }

    return Math.min(1, stress);
  };

  const updatePsychologicalState = (factors: TensionFactors) => {
    // Update doubt level based on conflicting information
    const newDoubtLevel = Math.max(0, Math.min(1, 
      factors.tellConflict * 0.4 +
      factors.playerUncertainty * 0.4 +
      factors.passengerDeception * 0.2
    ));
    setDoubtLevel(newDoubtLevel);

    // Update confidence level (inverse relationship with uncertainty)
    const decisionConfidence = currentDecision?.confidence || 0.5;
    const newConfidenceLevel = Math.max(0.1, Math.min(0.9,
      decisionConfidence * (1 - factors.playerUncertainty)
    ));
    setConfidenceLevel(newConfidenceLevel);
  };

  const updateStressIndicators = (factors: TensionFactors) => {
    const indicators: string[] = [];

    if (factors.passengerDeception > 0.6) {
      indicators.push("Passenger seems deceptive");
    }

    if (factors.tellConflict > 0.5) {
      indicators.push("Conflicting behavioral signals detected");
    }

    if (factors.timePresssure > 0.7) {
      indicators.push("Decision time running out");
    }

    if (factors.playerUncertainty > 0.7) {
      indicators.push("Difficult to read this passenger");
    }

    if (factors.environmentalStress > 0.5) {
      indicators.push("Hazardous driving conditions");
    }

    if (doubtLevel > 0.8) {
      indicators.push("Overwhelming uncertainty");
    }

    setStressIndicators(indicators);
  };

  const getTensionColor = (level: number) => {
    if (level >= 0.8) return styles.tensionCritical;
    if (level >= 0.6) return styles.tensionHigh;
    if (level >= 0.4) return styles.tensionModerate;
    if (level >= 0.2) return styles.tensionLow;
    return styles.tensionMinimal;
  };

  const getTensionLabel = (level: number) => {
    if (level >= 0.8) return 'CRITICAL';
    if (level >= 0.6) return 'HIGH';
    if (level >= 0.4) return 'MODERATE';
    if (level >= 0.2) return 'LOW';
    return 'CALM';
  };

  const getDoubtMessage = () => {
    if (doubtLevel >= 0.8) return "Should I trust my instincts or the rules?";
    if (doubtLevel >= 0.6) return "Something doesn't feel right...";
    if (doubtLevel >= 0.4) return "Mixed signals from this passenger";
    if (doubtLevel >= 0.2) return "Minor inconsistencies noticed";
    return "Passenger seems straightforward";
  };

  if (!isVisible) return null;

  return (
    <div className={styles.tensionContainer}>
      <div className={styles.header}>
        <h4 className={styles.title}>
          <span className={styles.titleIcon}>🧠</span>
          Psychological State
        </h4>
        <div className={`${styles.tensionLevel} ${getTensionColor(tensionFactors.overallTension)}`}>
          {getTensionLabel(tensionFactors.overallTension)}
        </div>
      </div>

      {/* Overall Tension Meter */}
      <div className={styles.mainMeter}>
        <div className={styles.meterLabel}>Tension Level</div>
        <div className={styles.meterTrack}>
          <div 
            className={`${styles.meterFill} ${getTensionColor(tensionFactors.overallTension)}`}
            style={{ width: `${tensionFactors.overallTension * 100}%` }}
          />
          <div className={styles.meterMarkers}>
            {[0.2, 0.4, 0.6, 0.8].map(marker => (
              <div 
                key={marker}
                className={styles.meterMarker}
                style={{ left: `${marker * 100}%` }}
              />
            ))}
          </div>
        </div>
        <div className={styles.meterValue}>
          {Math.round(tensionFactors.overallTension * 100)}%
        </div>
      </div>

      {/* Psychological Indicators */}
      <div className={styles.psychologySection}>
        <div className={styles.indicator}>
          <div className={styles.indicatorHeader}>
            <span className={styles.indicatorIcon}>❓</span>
            <span className={styles.indicatorLabel}>Doubt Level</span>
          </div>
          <div className={styles.indicatorBar}>
            <div 
              className={`${styles.indicatorFill} ${styles.doubtFill}`}
              style={{ width: `${doubtLevel * 100}%` }}
            />
          </div>
          <div className={styles.doubtMessage}>
            "{getDoubtMessage()}"
          </div>
        </div>

        <div className={styles.indicator}>
          <div className={styles.indicatorHeader}>
            <span className={styles.indicatorIcon}>🎯</span>
            <span className={styles.indicatorLabel}>Confidence</span>
          </div>
          <div className={styles.indicatorBar}>
            <div 
              className={`${styles.indicatorFill} ${styles.confidenceFill}`}
              style={{ width: `${confidenceLevel * 100}%` }}
            />
          </div>
          <div className={styles.confidenceValue}>
            {Math.round(confidenceLevel * 100)}% certain
          </div>
        </div>
      </div>

      {/* Tension Breakdown */}
      <div className={styles.breakdown}>
        <h5 className={styles.breakdownTitle}>Stress Factors:</h5>
        <div className={styles.factorList}>
          {Object.entries(tensionFactors).filter(([key]) => key !== 'overallTension').map(([key, value]) => (
            <div key={key} className={styles.factor}>
              <span className={styles.factorLabel}>
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
              </span>
              <div className={styles.factorBar}>
                <div 
                  className={styles.factorFill}
                  style={{ 
                    width: `${value * 100}%`,
                    backgroundColor: value > 0.6 ? '#ef4444' : value > 0.3 ? '#fbbf24' : '#22c55e'
                  }}
                />
              </div>
              <span className={styles.factorValue}>{Math.round(value * 100)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stress Indicators */}
      {stressIndicators.length > 0 && (
        <div className={styles.stressIndicators}>
          <h5 className={styles.stressTitle}>⚠️ Current Concerns:</h5>
          <ul className={styles.stressList}>
            {stressIndicators.map((indicator, index) => (
              <li key={index} className={styles.stressItem}>
                {indicator}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Phase Indicator */}
      <div className={styles.phaseIndicator}>
        <span className={styles.phaseLabel}>Learning Phase:</span>
        <span className={`${styles.phaseValue} ${styles[`phase${GuidelineEngine.getLearningCurvePhase(gameState)}`]}`}>
          {GuidelineEngine.getLearningCurvePhase(gameState).toUpperCase()}
        </span>
      </div>
    </div>
  );
};