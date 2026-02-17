import { gameData } from '../data/gameData';
import { guidelineData } from '../data/guidelineData';
import { GuidelineEngine } from './guidelineEngine';
import type {
  Rule,
  PlayerStats,
  GameState,
  GameEngineResult,
  HiddenRuleViolation,
  Passenger,
  Guideline,
} from '../types/game';

export class GameEngine {
  static calculatePlayerExperience(playerStats: PlayerStats): number {
    return playerStats.totalShiftsCompleted * 2 + playerStats.totalRidesCompleted;
  }

  static generateShiftRules(playerExperience: number = 0): GameEngineResult {
    const difficultyLevel = Math.min(4, Math.floor(playerExperience / 10));

    // Use guidelines system for experienced players (experience >= 20)
    if (playerExperience >= 20) {
      return this.generateShiftGuidelines(playerExperience, difficultyLevel);
    }

    // Traditional rule system for new players
    const basicRules = gameData.shift_rules.filter(rule => rule.type === 'basic');
    const conditionalRules = gameData.shift_rules.filter(rule => rule.type === 'conditional');

    const selectedRules: Rule[] = [];

    // Always include 2-3 basic rules
    const shuffledBasic = [...basicRules].sort(() => 0.5 - Math.random());
    selectedRules.push(...shuffledBasic.slice(0, 2 + Math.floor(Math.random() * 2)));

    // Add conditional rules based on difficulty
    if (difficultyLevel >= 1) {
      const shuffledConditional = [...conditionalRules].sort(() => 0.5 - Math.random());
      selectedRules.push(...shuffledConditional.slice(0, Math.floor(Math.random() * 2) + 1));
    }

    const visibleRules = selectedRules.filter(rule => rule.visible);
    const hiddenActiveRules = selectedRules.filter(rule => !rule.visible);

    return {
      visibleRules,
      hiddenRules: hiddenActiveRules,
      difficultyLevel,
    };
  }

  static generateShiftGuidelines(
    playerExperience: number,
    difficultyLevel: number
  ): GameEngineResult {
    // Select 3-4 guidelines based on difficulty
    const numGuidelines = Math.min(6, 3 + difficultyLevel);
    const shuffledGuidelines = [...guidelineData].sort(() => 0.5 - Math.random());
    const selectedGuidelines = shuffledGuidelines.slice(0, numGuidelines);

    // Convert guidelines to rules for compatibility
    const visibleRules: Rule[] = selectedGuidelines.map(guideline => ({
      id: guideline.id,
      title: guideline.title,
      description: guideline.description,
      difficulty: guideline.difficulty,
      type: guideline.type,
      visible: guideline.visible,
      conflictsWith: guideline.conflictsWith,
      trigger: guideline.trigger,
      violationMessage: guideline.violationMessage,
      actionKey: guideline.actionKey,
      actionType: guideline.actionType,
      defaultSafety: guideline.defaultSafety,
      defaultOutcome: guideline.defaultOutcome,
      exceptions: guideline.exceptions,
      followConsequences: guideline.followConsequences,
      breakConsequences: guideline.breakConsequences,
      exceptionRewards: guideline.exceptionRewards,
      relatedGuidelineId: guideline.id,
    }));

    return {
      visibleRules,
      hiddenRules: [],
      difficultyLevel,
      guidelines: selectedGuidelines,
    };
  }

  static checkRuleViolation(gameState: GameState, action: string): Rule | null {
    // If using guideline system, handle differently
    if (gameState.currentGuidelines && gameState.currentPassenger) {
      return this.checkGuidelineViolation(gameState, action);
    }

    // Traditional rule checking
    for (const rule of gameState.currentRules) {
      if (this.isRuleViolated(rule, gameState, action)) {
        return rule;
      }
    }
    return null;
  }

  static checkGuidelineViolation(gameState: GameState, action: string): Rule | null {
    if (!gameState.currentGuidelines || !gameState.currentPassenger) {
      return null;
    }

    // Find the relevant guideline for this action
    const relevantGuideline = this.findRelevantGuideline(gameState.currentGuidelines, action);
    if (!relevantGuideline) return null;

    // Analyze passenger for tells and exceptions
    const detectedTells = GuidelineEngine.analyzePassenger(gameState.currentPassenger, gameState, [
      relevantGuideline,
    ]);

    // If breaking a guideline, check if it's the right choice
    if (this.isGuidelineBreaking(action, relevantGuideline)) {
      const consequences = GuidelineEngine.evaluateGuidelineChoice(
        relevantGuideline.id,
        'break',
        gameState.currentPassenger,
        gameState,
        [relevantGuideline]
      );

      // Record the decision
      GuidelineEngine.recordDecision(
        relevantGuideline.id,
        gameState.currentPassenger,
        'break',
        consequences,
        detectedTells.map(d => d.tell),
        gameState
      );

      // Check if breaking was the wrong choice
      const hasDeathConsequence = consequences.some(c => c.type === 'death');
      if (hasDeathConsequence && Math.random() < 0.7) {
        return relevantGuideline; // Return as violation (causes death)
      }
    }

    return null;
  }

  static checkHiddenRuleViolations(
    gameState: GameState,
    passenger: Passenger
  ): HiddenRuleViolation | null {
    const hiddenRules = gameState.hiddenRules || [];

    for (const rule of hiddenRules) {
      if (this.isHiddenRuleViolated(rule, gameState, passenger)) {
        return { rule };
      }
    }
    return null;
  }

  private static isRuleViolated(rule: Rule, gameState: GameState, action: string): boolean {
    switch (rule.id) {
      case 1: // No Eye Contact
        return action === 'eye_contact';
      case 2: // Silent Night
        return action === 'play_music';
      case 3: // Cash Only
        return action === 'accept_tip';
      case 4: // Windows Sealed
        return action === 'open_window';
      case 5: // Route Restriction
        return action === 'take_shortcut';
      default:
        return false;
    }
  }

  private static isHiddenRuleViolated(
    _rule: Rule,
    _gameState: GameState,
    _passenger: Passenger
  ): boolean {
    // Simplified hidden rule checking
    return false;
  }

  static calculateScore(earnings: number, ridesCompleted: number, timeSpent: number): number {
    return Math.round(earnings * 0.4 + ridesCompleted * 20 + timeSpent * 0.1);
  }

  // Helper methods for guideline system
  private static findRelevantGuideline(guidelines: Guideline[], action: string): Guideline | null {
    const actionToGuidelineMap: Record<string, number> = {
      eye_contact: 1001, // Never Make Eye Contact
      take_shortcut: 1002, // Always Follow GPS
      accept_tip: 1003, // Cash Only Payment
      speak_first: 1007, // Never Speak First
      stop_car: 1008, // Never Stop Until Drop-Off
      open_window: 1009, // Keep Windows Sealed
      take_detour: 1010, // No Shortcuts or Detours
    };

    const guidelineId = actionToGuidelineMap[action];
    return guidelines.find(g => g.id === guidelineId) || null;
  }

  private static isGuidelineBreaking(action: string, _guideline: Guideline): boolean {
    // Actions that constitute breaking guidelines
    const breakingActions = [
      'eye_contact',
      'take_shortcut',
      'accept_tip',
      'speak_first',
      'stop_car',
      'open_window',
      'take_detour',
    ];
    return breakingActions.includes(action);
  }
}
