import React, { useState, useEffect } from 'react';
import type { Guideline, Passenger, GameState, DetectedTell } from '../../../types/game';
import { GuidelineEngine } from '../../../services/guidelineEngine';
import Portrait from '../../common/Portrait/Portrait';
import styles from './GuidelineChoice.module.css';

interface GuidelineChoiceProps {
  guideline: Guideline;
  passenger: Passenger;
  gameState: GameState;
  onChoice: (action: 'follow' | 'break', reasoning?: string) => void;
  isVisible: boolean;
}

export const GuidelineChoice: React.FC<GuidelineChoiceProps> = ({
  guideline,
  passenger,
  gameState,
  onChoice,
  isVisible,
}) => {
  const [detectedTells, setDetectedTells] = useState<DetectedTell[]>([]);
  const [playerReasoning, setPlayerReasoning] = useState('');
  const [showReasoningInput, setShowReasoningInput] = useState(false);
  const [pendingChoice, setPendingChoice] = useState<'follow' | 'break' | null>(null);
  const [timeToDecide, setTimeToDecide] = useState(30); // 30 second decision timer

  useEffect(() => {
    if (isVisible) {
      // Analyze passenger for tells when component becomes visible
      const tells = GuidelineEngine.analyzePassenger(passenger, gameState, [guideline]);
      setDetectedTells(tells);

      // Start decision timer
      const timer = setInterval(() => {
        setTimeToDecide(prev => {
          if (prev <= 1) {
            // Auto-follow guideline if time runs out
            onChoice('follow', 'Time ran out - defaulted to following guideline');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isVisible, passenger, gameState, guideline, onChoice]);

  const handleChoice = (choice: 'follow' | 'break') => {
    if (showReasoningInput) {
      setPendingChoice(choice);
    } else {
      onChoice(choice, playerReasoning || undefined);
    }
  };

  const handleSubmitWithReasoning = () => {
    if (pendingChoice) {
      onChoice(pendingChoice, playerReasoning || undefined);
    }
  };

  const getTimeColor = () => {
    if (timeToDecide <= 10) return styles.timeColorCritical;
    if (timeToDecide <= 20) return styles.timeColorWarning;
    return styles.timeColorNormal;
  };

  const getTellIntensityIcon = (intensity: 'subtle' | 'moderate' | 'obvious') => {
    switch (intensity) {
      case 'obvious':
        return '🔴';
      case 'moderate':
        return '🟡';
      case 'subtle':
        return '🔵';
    }
  };

  const getTellTypeIcon = (type: 'verbal' | 'behavioral' | 'visual' | 'environmental') => {
    switch (type) {
      case 'verbal':
        return '💬';
      case 'behavioral':
        return '🎭';
      case 'visual':
        return '👁️';
      case 'environmental':
        return '🌫️';
    }
  };

  const getReadingDifficulty = () => {
    const difficulty = GuidelineEngine.calculateReadingDifficulty(passenger, gameState);
    if (difficulty >= 0.7) return { text: 'Very Hard to Read', color: styles.difficultyVeryHard };
    if (difficulty >= 0.5) return { text: 'Hard to Read', color: styles.difficultyHard };
    if (difficulty >= 0.3) return { text: 'Moderate', color: styles.difficultyModerate };
    return { text: 'Easy to Read', color: styles.difficultyEasy };
  };

  const readingDifficulty = getReadingDifficulty();

  if (!isVisible) return null;

  return (
    <div className={styles.choiceContainer}>
      {/* Header */}
      <div className={styles.header}>
        <h3 className={styles.title}>⚖️ Guideline Decision Required</h3>
        <div className={`${styles.timer} ${getTimeColor()}`}>
          <span className={styles.timerIcon}>⏱️</span>
          <span className={styles.timerText}>{timeToDecide}s</span>
        </div>
      </div>

      {/* Guideline Information */}
      <div className={styles.guidelineInfo}>
        <h4 className={styles.guidelineTitle}>{guideline.title}</h4>
        <p className={styles.guidelineDescription}>{guideline.description}</p>
        <div className={`${styles.safetyLevel} ${styles[`safety${guideline.defaultSafety}`]}`}>
          Default Safety: {guideline.defaultSafety.toUpperCase()}
        </div>
      </div>

      {/* Passenger Context */}
      <div className={styles.passengerContext}>
        <div className={styles.passengerHeader}>
          <Portrait
            passengerName={passenger.name}
            emoji={passenger.emoji}
            size="small"
            className={styles.passengerEmoji}
          />
          <span className={styles.passengerName}>{passenger.name}</span>
          <div className={`${styles.readingDifficulty} ${readingDifficulty.color}`}>
            {readingDifficulty.text}
          </div>
        </div>

        {passenger.stressLevel !== undefined && (
          <div className={styles.stressIndicator}>
            Stress Level:
            <div className={styles.stressBar}>
              <div
                className={styles.stressLevel}
                style={{ width: `${passenger.stressLevel * 100}%` }}
              />
            </div>
            <span className={styles.stressValue}>{Math.round(passenger.stressLevel * 100)}%</span>
          </div>
        )}
      </div>

      {/* Detected Tells */}
      {detectedTells.length > 0 && (
        <div className={styles.tellsSection}>
          <h4 className={styles.tellsTitle}>🔍 What You Notice:</h4>
          <div className={styles.tellsList}>
            {detectedTells.map((detectedTell, index) => (
              <div
                key={index}
                className={`${styles.tell} ${styles[`tell${detectedTell.tell.intensity}`]}`}
              >
                <div className={styles.tellIcons}>
                  {getTellIntensityIcon(detectedTell.tell.intensity)}
                  {getTellTypeIcon(detectedTell.tell.type)}
                </div>
                <div className={styles.tellContent}>
                  <span className={styles.tellDescription}>{detectedTell.tell.description}</span>
                  {detectedTell.tell.triggerPhrase && (
                    <div className={styles.tellPhrase}>"{detectedTell.tell.triggerPhrase}"</div>
                  )}
                  <div className={styles.tellMeta}>
                    {detectedTell.tell.type} • {detectedTell.tell.intensity}
                    {detectedTell.playerNoticed ? ' • Noticed' : ' • Missed'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Player Reasoning Input */}
      {showReasoningInput && (
        <div className={styles.reasoningSection}>
          <label className={styles.reasoningLabel}>
            Why are you making this choice? (Optional)
          </label>
          <textarea
            value={playerReasoning}
            onChange={e => setPlayerReasoning(e.target.value)}
            placeholder="I think the passenger is..."
            className={styles.reasoningInput}
            maxLength={200}
          />
        </div>
      )}

      {/* Choice Buttons */}
      <div className={styles.choiceButtons}>
        <button
          onClick={() => handleChoice('follow')}
          className={`${styles.choiceButton} ${styles.followButton}`}
          disabled={!!pendingChoice}
        >
          <span className={styles.buttonIcon}>✅</span>
          <div className={styles.buttonContent}>
            <span className={styles.buttonTitle}>Follow Guideline</span>
            <span className={styles.buttonDescription}>
              Stick to "{guideline.title}" - the safe choice
            </span>
          </div>
        </button>

        <button
          onClick={() => handleChoice('break')}
          className={`${styles.choiceButton} ${styles.breakButton}`}
          disabled={!!pendingChoice}
        >
          <span className={styles.buttonIcon}>⚠️</span>
          <div className={styles.buttonContent}>
            <span className={styles.buttonTitle}>Break Guideline</span>
            <span className={styles.buttonDescription}>
              Trust your reading of the passenger - take the risk
            </span>
          </div>
        </button>
      </div>

      {/* Options */}
      <div className={styles.options}>
        <label className={styles.optionToggle}>
          <input
            type="checkbox"
            checked={showReasoningInput}
            onChange={e => setShowReasoningInput(e.target.checked)}
          />
          <span>Explain my reasoning</span>
        </label>
      </div>

      {/* Submit with reasoning */}
      {showReasoningInput && pendingChoice && (
        <div className={styles.submitSection}>
          <button onClick={handleSubmitWithReasoning} className={styles.submitButton}>
            Submit {pendingChoice === 'follow' ? 'Follow' : 'Break'} Decision
          </button>
        </div>
      )}
    </div>
  );
};
