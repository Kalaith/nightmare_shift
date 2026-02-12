import React, { useState, useEffect } from 'react';
import type { GameState, Passenger, Guideline, DetectedTell } from '../../../types/game';
import styles from './RiskAssessment.module.css';

interface RiskAssessmentProps {
  gameState: GameState;
  passenger: Passenger;
  guidelines: Guideline[];
  detectedTells: DetectedTell[];
  isVisible: boolean;
}

interface RiskAnalysis {
  overallRisk: number;
  trustworthiness: number;
  deceptionLikelihood: number;
  recommendations: string[];
  conflictingSignals: boolean;
  uncertaintyLevel: number;
}

export const RiskAssessment: React.FC<RiskAssessmentProps> = ({
  gameState,
  passenger,
  guidelines,
  detectedTells,
  isVisible
}) => {
  const [analysis, setAnalysis] = useState<RiskAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!isVisible || !passenger) {
      setAnalysis(null);
      return;
    }

    setIsAnalyzing(true);
    
    // Simulate analysis delay for tension
    const analysisDelay = 1000 + Math.random() * 1500;
    
    setTimeout(() => {
      const newAnalysis = calculateRiskAnalysis(
        gameState,
        passenger,
        guidelines,
        detectedTells
      );
      setAnalysis(newAnalysis);
      setIsAnalyzing(false);
    }, analysisDelay);
  }, [gameState, passenger, guidelines, detectedTells, isVisible]);

  const calculateRiskAnalysis = (
    gameState: GameState,
    passenger: Passenger,
    guidelines: Guideline[],
    tells: DetectedTell[]
  ): RiskAnalysis => {
    const playerTrust = gameState.playerTrust || 0;
    const passengerStress = passenger.stressLevel || 0.5;
    const deceptionLevel = passenger.deceptionLevel || 0;
    
    // Calculate base trustworthiness
    let trustworthiness = 0.5;
    if (passenger.supernatural.includes('Ghost')) trustworthiness -= 0.2;
    if (passenger.supernatural.includes('child')) trustworthiness += 0.3;
    if (deceptionLevel > 0) trustworthiness -= deceptionLevel;

    // Analyze tells for conflicting signals
    const obviousTells = tells.filter(t => t.tell.intensity === 'obvious');
    const subtleTells = tells.filter(t => t.tell.intensity === 'subtle');
    const conflictingSignals = obviousTells.length > 0 && subtleTells.length > 0;
    
    // Calculate deception likelihood
    const deceptionLikelihood = Math.min(0.9, 
      deceptionLevel + 
      (conflictingSignals ? 0.3 : 0) + 
      (passengerStress > 0.7 ? 0.2 : 0)
    );

    // Calculate overall risk
    const tellsReliability = tells.length > 0 
      ? tells.reduce((sum, t) => sum + t.tell.reliability, 0) / tells.length 
      : 0.5;
    
    const overallRisk = Math.min(0.95, Math.max(0.05,
      (1 - trustworthiness) * 0.4 +
      deceptionLikelihood * 0.3 +
      (1 - tellsReliability) * 0.2 +
      (1 - playerTrust) * 0.1
    ));

    // Calculate uncertainty
    const uncertaintyLevel = Math.min(0.9,
      (conflictingSignals ? 0.4 : 0) +
      (tells.filter(t => !t.playerNoticed).length / Math.max(1, tells.length)) * 0.3 +
      (Math.abs(passengerStress - 0.5)) * 0.3
    );

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (overallRisk > 0.7) {
      recommendations.push("⚠️ High risk passenger - consider following guidelines strictly");
    } else if (overallRisk < 0.3) {
      recommendations.push("✅ Relatively safe passenger - exception scenarios may apply");
    }

    if (deceptionLikelihood > 0.6) {
      recommendations.push("🎭 High deception risk - tells may be misleading");
    }

    if (conflictingSignals) {
      recommendations.push("🔄 Conflicting signals detected - analyze carefully");
    }

    if (uncertaintyLevel > 0.6) {
      recommendations.push("❓ High uncertainty - trust your instincts");
    }

    if (playerTrust < 0.5) {
      recommendations.push("📈 Improve perception skill through correct decisions");
    }

    return {
      overallRisk,
      trustworthiness,
      deceptionLikelihood,
      recommendations,
      conflictingSignals,
      uncertaintyLevel
    };
  };

  const getRiskColor = (risk: number) => {
    if (risk >= 0.7) return styles.riskHigh;
    if (risk >= 0.4) return styles.riskMedium;
    return styles.riskLow;
  };

  const getRiskLabel = (risk: number) => {
    if (risk >= 0.8) return 'Extreme Risk';
    if (risk >= 0.6) return 'High Risk';
    if (risk >= 0.4) return 'Moderate Risk';
    if (risk >= 0.2) return 'Low Risk';
    return 'Minimal Risk';
  };

  const getUncertaintyIcon = (uncertainty: number) => {
    if (uncertainty >= 0.7) return '❓❓❓';
    if (uncertainty >= 0.5) return '❓❓';
    if (uncertainty >= 0.3) return '❓';
    return '✓';
  };

  if (!isVisible) return null;

  return (
    <div className={styles.assessmentContainer}>
      <div className={styles.header}>
        <h4 className={styles.title}>
          <span className={styles.titleIcon}>🎯</span>
          Risk Assessment
        </h4>
        <button
          className={styles.toggleDetails}
          onClick={() => setShowDetails(!showDetails)}
          disabled={isAnalyzing}
        >
          {showDetails ? '👁️‍🗨️ Hide' : '👁️ Details'}
        </button>
      </div>

      {isAnalyzing ? (
        <div className={styles.analyzing}>
          <div className={styles.analyzingSpinner}></div>
          <span className={styles.analyzingText}>Analyzing passenger...</span>
        </div>
      ) : analysis ? (
        <>
          {/* Risk Overview */}
          <div className={styles.riskOverview}>
            <div className={styles.riskMeter}>
              <div className={styles.riskLabel}>Overall Risk</div>
              <div className={styles.riskBar}>
                <div 
                  className={`${styles.riskFill} ${getRiskColor(analysis.overallRisk)}`}
                  style={{ width: `${analysis.overallRisk * 100}%` }}
                />
              </div>
              <div className={`${styles.riskValue} ${getRiskColor(analysis.overallRisk)}`}>
                {getRiskLabel(analysis.overallRisk)}
              </div>
            </div>

            <div className={styles.uncertaintyIndicator}>
              <span className={styles.uncertaintyIcon}>
                {getUncertaintyIcon(analysis.uncertaintyLevel)}
              </span>
              <span className={styles.uncertaintyText}>
                {Math.round(analysis.uncertaintyLevel * 100)}% Uncertain
              </span>
            </div>
          </div>

          {/* Quick Indicators */}
          <div className={styles.indicators}>
            <div className={styles.indicator}>
              <span className={styles.indicatorIcon}>🤝</span>
              <span className={styles.indicatorLabel}>Trust</span>
              <div className={styles.indicatorBar}>
                <div 
                  className={styles.indicatorFill}
                  style={{ 
                    width: `${analysis.trustworthiness * 100}%`,
                    backgroundColor: analysis.trustworthiness > 0.6 ? '#22c55e' : 
                                   analysis.trustworthiness > 0.3 ? '#fbbf24' : '#ef4444'
                  }}
                />
              </div>
            </div>

            <div className={styles.indicator}>
              <span className={styles.indicatorIcon}>🎭</span>
              <span className={styles.indicatorLabel}>Deception</span>
              <div className={styles.indicatorBar}>
                <div 
                  className={styles.indicatorFill}
                  style={{ 
                    width: `${analysis.deceptionLikelihood * 100}%`,
                    backgroundColor: analysis.deceptionLikelihood > 0.6 ? '#ef4444' : 
                                   analysis.deceptionLikelihood > 0.3 ? '#fbbf24' : '#22c55e'
                  }}
                />
              </div>
            </div>

            {analysis.conflictingSignals && (
              <div className={styles.warningIndicator}>
                <span className={styles.warningIcon}>⚠️</span>
                <span className={styles.warningText}>Conflicting Signals</span>
              </div>
            )}
          </div>

          {/* Recommendations */}
          {analysis.recommendations.length > 0 && (
            <div className={styles.recommendations}>
              <h5 className={styles.recommendationsTitle}>Recommendations:</h5>
              <ul className={styles.recommendationsList}>
                {analysis.recommendations.map((rec, index) => (
                  <li key={index} className={styles.recommendation}>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Detailed Analysis */}
          {showDetails && (
            <div className={styles.detailedAnalysis}>
              <div className={styles.analysisSection}>
                <h6 className={styles.analysisTitle}>Passenger Profile</h6>
                <div className={styles.analysisGrid}>
                  <div className={styles.analysisItem}>
                    <span className={styles.analysisLabel}>Supernatural Type:</span>
                    <span className={styles.analysisValue}>{passenger.supernatural}</span>
                  </div>
                  <div className={styles.analysisItem}>
                    <span className={styles.analysisLabel}>Stress Level:</span>
                    <span className={styles.analysisValue}>
                      {Math.round((passenger.stressLevel || 0) * 100)}%
                    </span>
                  </div>
                  <div className={styles.analysisItem}>
                    <span className={styles.analysisLabel}>Deception Risk:</span>
                    <span className={styles.analysisValue}>
                      {Math.round((passenger.deceptionLevel || 0) * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.analysisSection}>
                <h6 className={styles.analysisTitle}>Tell Analysis</h6>
                <div className={styles.tellAnalysis}>
                  <span>Total: {detectedTells.length}</span>
                  <span>Noticed: {detectedTells.filter(t => t.playerNoticed).length}</span>
                  <span>Obvious: {detectedTells.filter(t => t.tell.intensity === 'obvious').length}</span>
                  <span>Exceptions: {detectedTells.filter(t => t.exceptionId).length}</span>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className={styles.noAnalysis}>
          <span className={styles.noAnalysisIcon}>❌</span>
          <span className={styles.noAnalysisText}>Unable to assess risk</span>
        </div>
      )}
    </div>
  );
};
