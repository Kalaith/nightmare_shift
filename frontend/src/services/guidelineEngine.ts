import type {
  Guideline,
  GuidelineException,
  GuidelineConsequence,
  PassengerTell,
  DetectedTell,
  GuidelineDecision,
  Passenger,
  GameState,
} from '../types/game';

export class GuidelineEngine {
  /**
   * Analyzes a passenger and current game state to detect active tells and exceptions
   */
  static analyzePassenger(
    passenger: Passenger,
    gameState: GameState,
    guidelines: Guideline[]
  ): DetectedTell[] {
    const detectedTells: DetectedTell[] = [];
    const currentTime = Date.now();

    if (!passenger.tells || !passenger.guidelineExceptions) {
      return detectedTells;
    }

    for (const guideline of guidelines) {
      for (const exception of guideline.exceptions) {
        // Check if this passenger can trigger this exception
        const canTrigger = this.passengerMatchesException(passenger, exception);
        if (!canTrigger) continue;

        // Check if conditions are met
        const conditionsMet = this.checkExceptionConditions(exception, gameState, passenger);
        if (!conditionsMet) continue;

        // Find relevant tells for this exception
        for (const tell of exception.tells) {
          const detected: DetectedTell = {
            tell,
            passengerId: passenger.id,
            detectionTime: currentTime,
            playerNoticed: this.calculateDetectionProbability(tell, gameState),
            relatedGuideline: guideline.id,
            exceptionId: exception.id,
          };

          detectedTells.push(detected);
        }
      }
    }

    return detectedTells;
  }

  /**
   * Evaluates whether following or breaking a guideline is the safer choice
   */
  static evaluateGuidelineChoice(
    guidelineId: number,
    action: 'follow' | 'break',
    passenger: Passenger,
    gameState: GameState,
    guidelines: Guideline[]
  ): GuidelineConsequence[] {
    const guideline = guidelines.find(g => g.id === guidelineId);
    if (!guideline) return [];

    // Check if there's an active exception for this passenger
    const activeException = this.findActiveException(guideline, passenger, gameState);

    if (activeException) {
      // Exception is active - breaking might be safer
      if (action === 'break' && activeException.breakingSafer) {
        return this.calculatePositiveConsequences(guideline, activeException);
      } else if (action === 'follow' && !activeException.breakingSafer) {
        return guideline.followConsequences;
      } else {
        return this.calculateNegativeConsequences(guideline, activeException);
      }
    } else {
      // No exception - follow default behavior
      if (action === 'follow') {
        return guideline.followConsequences;
      } else {
        return guideline.breakConsequences;
      }
    }
  }

  /**
   * Records a guideline decision and its outcome for learning purposes
   */
  static recordDecision(
    guidelineId: number,
    passenger: Passenger,
    action: 'follow' | 'break',
    outcome: GuidelineConsequence[],
    tellsPresent: PassengerTell[],
    gameState: GameState
  ): GuidelineDecision {
    const decision: GuidelineDecision = {
      guidelineId,
      passengerId: passenger.id,
      action,
      outcome,
      wasCorrect: this.evaluateDecisionCorrectness(outcome),
      tellsPresent,
      timestamp: Date.now(),
    };

    // Update player trust based on correct decisions
    if (decision.wasCorrect) {
      gameState.playerTrust = Math.min(1, (gameState.playerTrust || 0) + 0.1);
    } else {
      gameState.playerTrust = Math.max(0, (gameState.playerTrust || 0) - 0.2);
    }

    // Add to decision history
    if (!gameState.decisionHistory) {
      gameState.decisionHistory = [];
    }
    gameState.decisionHistory.push(decision);

    return decision;
  }

  /**
   * Gets available choices for a guideline interaction
   */
  static getGuidelineChoices(
    guideline: Guideline,
    passenger: Passenger,
    gameState: GameState
  ): { follow: string; break: string; tells: DetectedTell[] } {
    const tells = this.analyzePassenger(passenger, gameState, [guideline]);

    const followText = `Follow "${guideline.title}" - ${guideline.description}`;
    const breakText = `Break "${guideline.title}" - Take the risk`;

    return {
      follow: followText,
      break: breakText,
      tells,
    };
  }

  /**
   * Calculates the difficulty of reading a passenger correctly
   */
  static calculateReadingDifficulty(passenger: Passenger, gameState: GameState): number {
    let difficulty = 0.5; // Base difficulty

    // Passenger deception level affects difficulty
    if (passenger.deceptionLevel) {
      difficulty += passenger.deceptionLevel * 0.3;
    }

    // Player trust affects accuracy
    const playerTrust = gameState.playerTrust || 0;
    difficulty -= playerTrust * 0.2;

    // Experience affects reading ability
    const decisions = gameState.decisionHistory?.length || 0;
    const experienceBonus = Math.min(0.3, decisions * 0.01);
    difficulty -= experienceBonus;

    // Progressive difficulty scaling
    difficulty += this.getProgressiveDifficultyModifier(gameState);

    return Math.max(0.1, Math.min(0.9, difficulty));
  }

  /**
   * Calculates progressive difficulty modifier based on player experience
   */
  static getProgressiveDifficultyModifier(gameState: GameState): number {
    const totalRides = gameState.ridesCompleted || 0;
    const correctDecisions = gameState.decisionHistory?.filter(d => d.wasCorrect).length || 0;
    const playerSkillLevel = totalRides > 0 ? correctDecisions / totalRides : 0;

    // Scale difficulty based on player success rate
    let modifier = 0;

    if (totalRides > 10) {
      // After 10 rides, start scaling difficulty
      if (playerSkillLevel > 0.8) {
        // High skill players get harder scenarios
        modifier += 0.2;
      } else if (playerSkillLevel > 0.6) {
        // Medium skill players get slight increase
        modifier += 0.1;
      } else if (playerSkillLevel < 0.3) {
        // Low skill players get slight help
        modifier -= 0.1;
      }
    }

    if (totalRides > 25) {
      // After 25 rides, add more challenge for experienced players
      modifier += Math.min(0.15, totalRides * 0.002);
    }

    return modifier;
  }

  /**
   * Determines if false tells should be introduced for advanced players
   */
  static shouldIntroduceFalseTells(gameState: GameState): boolean {
    const totalRides = gameState.ridesCompleted || 0;
    const correctDecisions = gameState.decisionHistory?.filter(d => d.wasCorrect).length || 0;
    const playerSkillLevel = totalRides > 0 ? correctDecisions / totalRides : 0;

    // Introduce false tells for experienced, skilled players
    if (totalRides > 20 && playerSkillLevel > 0.7) {
      return Math.random() < 0.3; // 30% chance of false tells
    }

    if (totalRides > 35 && playerSkillLevel > 0.6) {
      return Math.random() < 0.5; // 50% chance for very experienced players
    }

    return false;
  }

  /**
   * Gets learning curve phase based on player experience
   */
  static getLearningCurvePhase(gameState: GameState): 'early' | 'mid' | 'late' | 'expert' {
    const totalRides = gameState.ridesCompleted || 0;
    const correctDecisions = gameState.decisionHistory?.filter(d => d.wasCorrect).length || 0;
    const playerSkillLevel = totalRides > 0 ? correctDecisions / totalRides : 0;

    if (totalRides < 5) {
      return 'early'; // Clear tells, obvious consequences
    } else if (totalRides < 15) {
      return 'mid'; // Subtle hints, mixed signals
    } else if (totalRides < 30 || playerSkillLevel < 0.6) {
      return 'late'; // Deception, false tells, advanced psychology
    } else {
      return 'expert'; // Maximum challenge, complex deception patterns
    }
  }

  // Private helper methods

  private static passengerMatchesException(
    passenger: Passenger,
    exception: GuidelineException
  ): boolean {
    if (exception.passengerIds && exception.passengerIds.includes(passenger.id)) {
      return true;
    }

    if (exception.passengerTypes && exception.passengerTypes.includes(passenger.supernatural)) {
      return true;
    }

    return passenger.guidelineExceptions?.includes(exception.id) || false;
  }

  private static checkExceptionConditions(
    exception: GuidelineException,
    gameState: GameState,
    passenger: Passenger
  ): boolean {
    return exception.conditions.every(condition => {
      switch (condition.type) {
        case 'passenger_dialogue':
          return passenger.dialogue.some(line =>
            line.toLowerCase().includes(condition.value.toString().toLowerCase())
          );
        case 'passenger_behavior':
          return (
            passenger.stressLevel !== undefined &&
            this.compareValues(passenger.stressLevel, condition.value, condition.operator)
          );
        case 'time_based':
          return this.compareValues(gameState.timeRemaining, condition.value, condition.operator);
        case 'environmental':
          return gameState.currentWeather?.type === condition.value;
        default:
          return true;
      }
    });
  }

  private static compareValues(
    actual: number,
    expected: string | number,
    operator?: string
  ): boolean {
    const numExpected = typeof expected === 'string' ? parseFloat(expected) : expected;

    switch (operator) {
      case 'greater_than':
        return actual > numExpected;
      case 'less_than':
        return actual < numExpected;
      case 'equals':
      default:
        return actual === numExpected;
    }
  }

  private static calculateDetectionProbability(tell: PassengerTell, gameState: GameState): boolean {
    const playerTrust = gameState.playerTrust || 0;
    const baseProbability = tell.reliability;

    // Adjust probability based on tell intensity
    let intensityMultiplier = 1;
    switch (tell.intensity) {
      case 'subtle':
        intensityMultiplier = 0.3;
        break;
      case 'moderate':
        intensityMultiplier = 0.7;
        break;
      case 'obvious':
        intensityMultiplier = 1.0;
        break;
    }

    const finalProbability = baseProbability * intensityMultiplier * (0.5 + playerTrust * 0.5);
    return Math.random() < finalProbability;
  }

  private static findActiveException(
    guideline: Guideline,
    passenger: Passenger,
    gameState: GameState
  ): GuidelineException | null {
    for (const exception of guideline.exceptions) {
      if (
        this.passengerMatchesException(passenger, exception) &&
        this.checkExceptionConditions(exception, gameState, passenger)
      ) {
        return exception;
      }
    }
    return null;
  }

  private static calculatePositiveConsequences(
    guideline: Guideline,
    exception: GuidelineException
  ): GuidelineConsequence[] {
    return [
      {
        type: 'survival',
        value: 1,
        description: `Breaking "${guideline.title}" was the right choice - ${exception.description}`,
        probability: exception.probability,
      },
      {
        type: 'reputation',
        value: 10,
        description: 'Gained passenger trust through correct reading',
        probability: 0.8,
      },
    ];
  }

  private static calculateNegativeConsequences(
    guideline: Guideline,
    _exception: GuidelineException
  ): GuidelineConsequence[] {
    return [
      {
        type: 'death',
        value: 1,
        description: `Wrong choice regarding "${guideline.title}" - misread the passenger`,
        probability: 0.7,
      },
      {
        type: 'reputation',
        value: -20,
        description: 'Lost passenger trust through incorrect reading',
        probability: 0.9,
      },
    ];
  }

  private static evaluateDecisionCorrectness(consequences: GuidelineConsequence[]): boolean {
    return consequences.some(
      c => c.type === 'survival' || (c.type === 'reputation' && c.value > 0)
    );
  }
}
