import type { Rule, GameState, Passenger } from '../types/game';

export class RuleEngine {
  static validateAction(rules: Rule[], gameState: GameState, action: string): Rule | null {
    for (const rule of rules) {
      if (this.isViolation(rule, gameState, action)) {
        return rule;
      }
    }
    return null;
  }

  static isViolation(rule: Rule, gameState: GameState, action: string): boolean {
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

  static checkConflicts(rules: Rule[]): Rule[] {
    const conflicts: Rule[] = [];
    
    for (const rule of rules) {
      if (rule.conflictsWith) {
        for (const conflictId of rule.conflictsWith) {
          if (rules.some(r => r.id === conflictId)) {
            conflicts.push(rule);
            break;
          }
        }
      }
    }
    
    return conflicts;
  }

  static getViolationMessage(rule: Rule): string {
    return rule.violationMessage || `Rule violation: ${rule.title}`;
  }
}