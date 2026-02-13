import React, { useState, useEffect } from "react";
import type {
  GameState,
  Passenger,
  Guideline,
  DetectedTell,
  GuidelineDecision,
} from "../../../types/game";
import { GuidelineEngine } from "../../../services/guidelineEngine";
import { GuidelineChoice } from "../GuidelineChoice/GuidelineChoice";
import { TellIndicator } from "../TellIndicator/TellIndicator";
import { RiskAssessment } from "../RiskAssessment/RiskAssessment";
import Portrait from "../../common/Portrait/Portrait";
import styles from "./GuidelineInteraction.module.css";

interface GuidelineInteractionProps {
  gameState: GameState;
  passenger: Passenger;
  guidelines: Guideline[];
  onDecision: (decision: GuidelineDecision) => void;
  isActive: boolean;
  currentAction?: string; // The action being considered (e.g., 'eye_contact', 'take_shortcut')
}

interface InteractionState {
  phase: "analyzing" | "observing" | "deciding" | "completed";
  detectedTells: DetectedTell[];
  activeGuideline: Guideline | null;
  showRiskAssessment: boolean;
  observationTime: number;
}

export const GuidelineInteraction: React.FC<GuidelineInteractionProps> = ({
  gameState,
  passenger,
  guidelines,
  onDecision,
  isActive,
  currentAction,
}) => {
  const [interaction, setInteraction] = useState<InteractionState>({
    phase: "analyzing",
    detectedTells: [],
    activeGuideline: null,
    showRiskAssessment: false,
    observationTime: 10,
  });

  useEffect(() => {
    if (!isActive) {
      setInteraction((prev) => ({ ...prev, phase: "completed" }));
      return;
    }

    // Initialize interaction when becoming active
    if (interaction.phase === "completed") {
      startInteraction();
    }
  }, [isActive]);

  useEffect(() => {
    if (interaction.phase === "observing" && interaction.observationTime > 0) {
      const timer = setTimeout(() => {
        setInteraction((prev) => ({
          ...prev,
          observationTime: prev.observationTime - 1,
        }));
      }, 1000);

      return () => clearTimeout(timer);
    } else if (
      interaction.phase === "observing" &&
      interaction.observationTime === 0
    ) {
      // Move to decision phase
      setInteraction((prev) => ({
        ...prev,
        phase: "deciding",
      }));
    }
  }, [interaction.phase, interaction.observationTime]);

  const startInteraction = () => {
    // Find the relevant guideline for the current action
    const relevantGuideline = findRelevantGuideline(currentAction);

    setInteraction({
      phase: "analyzing",
      detectedTells: [],
      activeGuideline: relevantGuideline,
      showRiskAssessment: false,
      observationTime: 10,
    });

    // Start analysis phase
    setTimeout(() => {
      if (relevantGuideline) {
        const tells = GuidelineEngine.analyzePassenger(passenger, gameState, [
          relevantGuideline,
        ]);
        setInteraction((prev) => ({
          ...prev,
          phase: "observing",
          detectedTells: tells,
          observationTime: Math.max(
            5,
            10 - Math.floor((gameState.playerTrust || 0) * 5),
          ),
        }));
      }
    }, 1500);
  };

  const findRelevantGuideline = (action?: string): Guideline | null => {
    if (!action) return null;

    const actionToGuidelineMap: Record<string, number> = {
      eye_contact: 1001,
      take_shortcut: 1002,
      accept_tip: 1003,
      speak_first: 1004,
      stop_car: 1005,
      open_window: 1006,
    };

    const guidelineId = actionToGuidelineMap[action];
    return guidelines.find((g) => g.id === guidelineId) || null;
  };

  const handleChoice = (choice: "follow" | "break", reasoning?: string) => {
    if (!interaction.activeGuideline) return;

    const consequences = GuidelineEngine.evaluateGuidelineChoice(
      interaction.activeGuideline.id,
      choice,
      passenger,
      gameState,
      [interaction.activeGuideline],
    );

    const decision = GuidelineEngine.recordDecision(
      interaction.activeGuideline.id,
      passenger,
      choice,
      consequences,
      interaction.detectedTells.map((t) => t.tell),
      gameState,
    );

    if (reasoning) {
      decision.playerReason = reasoning;
    }

    setInteraction((prev) => ({ ...prev, phase: "completed" }));
    onDecision(decision);
  };

  const handleTellClick = (_tell: DetectedTell) => {
    // Toggle risk assessment when clicking on tells
    setInteraction((prev) => ({
      ...prev,
      showRiskAssessment: !prev.showRiskAssessment,
    }));
  };

  const toggleRiskAssessment = () => {
    setInteraction((prev) => ({
      ...prev,
      showRiskAssessment: !prev.showRiskAssessment,
    }));
  };

  if (!isActive || interaction.phase === "completed") {
    return null;
  }

  return (
    <div className={styles.interactionContainer}>
      {/* Phase Header */}
      <div className={styles.phaseHeader}>
        <div className={styles.phaseIndicator}>
          <div
            className={`${styles.phaseStep} ${interaction.phase === "analyzing" ? styles.active : styles.completed}`}
          >
            <span className={styles.stepNumber}>1</span>
            <span className={styles.stepLabel}>Analyzing</span>
          </div>
          <div className={styles.phaseConnector} />
          <div
            className={`${styles.phaseStep} ${interaction.phase === "observing" ? styles.active : interaction.phase === "deciding" ? styles.completed : ""}`}
          >
            <span className={styles.stepNumber}>2</span>
            <span className={styles.stepLabel}>Observing</span>
          </div>
          <div className={styles.phaseConnector} />
          <div
            className={`${styles.phaseStep} ${interaction.phase === "deciding" ? styles.active : ""}`}
          >
            <span className={styles.stepNumber}>3</span>
            <span className={styles.stepLabel}>Deciding</span>
          </div>
        </div>

        {interaction.phase === "observing" && (
          <div className={styles.observationTimer}>
            <span className={styles.timerIcon}>⏱️</span>
            <span className={styles.timerText}>
              {interaction.observationTime}s to observe
            </span>
          </div>
        )}
      </div>

      {/* Current Phase Content */}
      <div className={styles.phaseContent}>
        {interaction.phase === "analyzing" && (
          <div className={styles.analyzingPhase}>
            <div className={styles.analyzingSpinner}></div>
            <h3 className={styles.phaseTitle}>Analyzing Passenger...</h3>
            <p className={styles.phaseDescription}>
              Reading {passenger.name}'s behavior and psychological state
            </p>
          </div>
        )}

        {interaction.phase === "observing" && (
          <div className={styles.observingPhase}>
            <div className={styles.passengerContext}>
              <div className={styles.passengerInfo}>
                <Portrait
                  passengerName={passenger.name}
                  emoji={passenger.emoji}
                  size="medium"
                  className={styles.passengerEmoji}
                />
                <div className={styles.passengerDetails}>
                  <h3 className={styles.passengerName}>{passenger.name}</h3>
                  <p className={styles.passengerDescription}>
                    {passenger.description}
                  </p>
                </div>
              </div>

              {interaction.activeGuideline && (
                <div className={styles.guidelineContext}>
                  <h4 className={styles.contextTitle}>
                    Guideline in Question:
                  </h4>
                  <div className={styles.guidelineCard}>
                    <span className={styles.guidelineTitle}>
                      {interaction.activeGuideline.title}
                    </span>
                    <span className={styles.guidelineDesc}>
                      {interaction.activeGuideline.description}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <TellIndicator
              detectedTells={interaction.detectedTells}
              passenger={passenger}
              isActive={true}
              playerTrust={gameState.playerTrust || 0}
              onTellClicked={handleTellClick}
            />

            <div className={styles.observationControls}>
              <button
                className={styles.riskToggle}
                onClick={toggleRiskAssessment}
              >
                <span className={styles.buttonIcon}>🎯</span>
                {interaction.showRiskAssessment
                  ? "Hide Risk Analysis"
                  : "Show Risk Analysis"}
              </button>

              {interaction.observationTime <= 3 && (
                <div className={styles.proceedHint}>
                  <span className={styles.hintIcon}>💡</span>
                  <span className={styles.hintText}>
                    Decision time approaching - use your observations wisely
                  </span>
                </div>
              )}
            </div>

            {interaction.showRiskAssessment && (
              <RiskAssessment
                gameState={gameState}
                passenger={passenger}
                guidelines={guidelines}
                detectedTells={interaction.detectedTells}
                isVisible={true}
              />
            )}
          </div>
        )}

        {interaction.phase === "deciding" && interaction.activeGuideline && (
          <div className={styles.decidingPhase}>
            <div className={styles.decisionContext}>
              <h3 className={styles.decisionTitle}>Time to Decide</h3>
              <p className={styles.decisionDescription}>
                Based on your observations, what's your choice regarding "
                {interaction.activeGuideline.title}"?
              </p>
            </div>

            <GuidelineChoice
              guideline={interaction.activeGuideline}
              passenger={passenger}
              gameState={gameState}
              onChoice={handleChoice}
              isVisible={true}
            />

            {interaction.showRiskAssessment && (
              <RiskAssessment
                gameState={gameState}
                passenger={passenger}
                guidelines={guidelines}
                detectedTells={interaction.detectedTells}
                isVisible={true}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
