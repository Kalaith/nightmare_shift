import { gameData } from '../data/gameData';
import type { Rule, PlayerStats, GameState, GameEngineResult, HiddenRuleViolation, Passenger } from '../types/game';

export class GameEngine {
  static calculatePlayerExperience(playerStats: PlayerStats): number {
    return playerStats.totalShiftsCompleted * 2 + playerStats.totalRidesCompleted;
  }

  static generateShiftRules(playerExperience: number = 0): GameEngineResult {
    const difficultyLevel = Math.min(4, Math.floor(playerExperience / 10));
    
    const basicRules = gameData.shift_rules.filter(rule => rule.type === 'basic');
    const conditionalRules = gameData.shift_rules.filter(rule => rule.type === 'conditional');
    
    let selectedRules: Rule[] = [];
    
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
      difficultyLevel
    };
  }

  static checkRuleViolation(gameState: GameState, action: string): Rule | null {
    for (const rule of gameState.currentRules) {
      if (this.isRuleViolated(rule, gameState, action)) {
        return rule;
      }
    }
    return null;
  }

  static checkHiddenRuleViolations(gameState: GameState, passenger: Passenger): HiddenRuleViolation | null {
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

  private static isHiddenRuleViolated(_rule: Rule, _gameState: GameState, _passenger: Passenger): boolean {
    // Simplified hidden rule checking
    return false;
  }

  static calculateScore(earnings: number, ridesCompleted: number, timeSpent: number): number {
    return Math.round((earnings * 0.4) + (ridesCompleted * 20) + (timeSpent * 0.1));
  }
}