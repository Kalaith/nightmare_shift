import { gameData } from '../data/gameData.js';

// Rule Engine Service - handles rule validation and violation checking
export class RuleEngine {
  // Validate a player action against current rules
  static validateAction(action, gameState, passenger) {
    const allRules = [
      ...(gameState.currentRules || []),
      ...(gameState.hiddenRules || []),
      ...(gameState.temporaryRules || [])
    ];
    
    const violations = [];
    
    allRules.forEach(rule => {
      const violation = this.checkActionAgainstRule(action, rule, gameState, passenger);
      if (violation) {
        violations.push({
          rule,
          violation,
          severity: this.getRuleSeverity(rule)
        });
      }
    });
    
    return violations;
  }
  
  // Check specific action against a rule
  static checkActionAgainstRule(action, rule, gameState, passenger) {
    switch (rule.id) {
      case 1: // No Eye Contact
        if (action.type === 'look_at_passenger' || action.type === 'make_eye_contact') {
          return 'Made eye contact with passenger';
        }
        break;
        
      case 2: // Silent Night
        if (action.type === 'play_music' || action.type === 'turn_on_radio') {
          return 'Played music or turned on radio';
        }
        break;
        
      case 3: // Cash Only
        if (action.type === 'accept_tip' || action.type === 'accept_payment') {
          return 'Accepted tip or non-cash payment';
        }
        break;
        
      case 4: // Windows Sealed
        if (action.type === 'open_window' || action.type === 'roll_down_window') {
          return 'Opened window';
        }
        break;
        
      case 5: // Route Restriction
        if (action.type === 'deviate_route' || action.type === 'take_alternate_route') {
          return 'Deviated from GPS route';
        }
        break;
        
      case 6: // Midnight Curfew
        if (action.type === 'pickup_passenger' && rule.condition) {
          if (rule.condition(gameState, passenger)) {
            return 'Picked up passenger from cemetery after midnight';
          }
        }
        break;
        
      case 7: // Living Passengers Only
        if (action.type === 'pickup_passenger' && rule.condition) {
          if (rule.condition(gameState, passenger)) {
            return 'Transported supernatural entity during storm';
          }
        }
        break;
        
      case 8: // Hospital Protocol
        if (action.type === 'drop_off_passenger' && rule.condition) {
          if (rule.condition(gameState, passenger) && 
              action.location !== passenger.pickup) {
            return 'Medical personnel not returned to pickup location';
          }
        }
        break;
        
      case 9: // Emergency Response
        if (action.type === 'take_slow_route' && passenger?.inDistress) {
          return 'Failed to take fastest route for distressed passenger';
        }
        break;
        
      case 10: // Customer Service
        if (action.type === 'deny_request' && action.request?.reasonable) {
          return 'Denied reasonable passenger request';
        }
        break;
        
      case 11: // Safety First
        if (action.type === 'avoid_eye_contact' && passenger?.needsAttentionCheck) {
          return 'Failed to make eye contact to check passenger alertness';
        }
        break;
        
      default:
        // Handle custom or temporary rules
        if (rule.validate && typeof rule.validate === 'function') {
          return rule.validate(action, gameState, passenger);
        }
        break;
    }
    
    return null;
  }
  
  // Get rule severity for penalty calculation
  static getRuleSeverity(rule) {
    const severityMap = {
      'easy': 1,
      'medium': 2,
      'hard': 3,
      'expert': 4,
      'nightmare': 5
    };
    
    return severityMap[rule.difficulty] || 2;
  }
  
  // Check for rule conflicts in current rule set
  static findActiveConflicts(rules) {
    const conflicts = [];
    
    rules.forEach(rule => {
      if (rule.conflictsWith) {
        rule.conflictsWith.forEach(conflictId => {
          const conflictingRule = rules.find(r => r.id === conflictId);
          if (conflictingRule) {
            conflicts.push({
              rule1: rule,
              rule2: conflictingRule,
              type: 'direct_conflict',
              description: `"${rule.title}" directly conflicts with "${conflictingRule.title}"`
            });
          }
        });
      }
    });
    
    return conflicts;
  }
  
  // Suggest resolution for rule conflicts
  static suggestConflictResolution(conflict) {
    const suggestions = [];
    
    switch (conflict.type) {
      case 'direct_conflict':
        suggestions.push({
          action: 'prioritize_safety',
          description: 'When in doubt, prioritize passenger and driver safety',
          weight: 3
        });
        
        suggestions.push({
          action: 'follow_company_policy',
          description: 'Follow standard company policies over passenger requests',
          weight: 2
        });
        
        suggestions.push({
          action: 'communicate_limitation',
          description: 'Explain the limitation to the passenger politely',
          weight: 1
        });
        break;
        
      default:
        suggestions.push({
          action: 'use_judgment',
          description: 'Use your best judgment based on the situation',
          weight: 1
        });
        break;
    }
    
    return suggestions.sort((a, b) => b.weight - a.weight);
  }
  
  // Check if action creates new rule conflicts
  static wouldCreateConflict(action, rules) {
    // Simulate applying the action and check for resulting conflicts
    const potentialViolations = this.validateAction(action, { currentRules: rules }, null);
    
    // Check if this action would force violation of other rules
    const forcedViolations = rules.filter(rule => {
      return this.wouldActionForceViolation(action, rule);
    });
    
    return forcedViolations.length > 0;
  }
  
  // Check if an action would force violation of another rule
  static wouldActionForceViolation(action, rule) {
    // This is a complex check that depends on the specific action and rule
    // Implementation would need to be expanded based on specific rule interactions
    
    // Example: Opening window (violates rule 4) to comply with passenger request (rule 10)
    if (action.type === 'open_window' && rule.id === 4) {
      return true;
    }
    
    return false;
  }
  
  // Get rule hint text for UI display
  static getRuleHint(rule, gameState, passenger) {
    if (rule.conditionHint && rule.condition) {
      const applies = rule.condition(gameState, passenger);
      return applies ? rule.conditionHint : `${rule.conditionHint} (not active)`;
    }
    
    return rule.description;
  }
  
  // Calculate rule violation penalty
  static calculateViolationPenalty(violation) {
    const basePenalty = 10;
    const severityMultiplier = violation.severity || 1;
    
    // Different penalty types
    let penalty = basePenalty * severityMultiplier;
    
    // Hidden rule violations are more severe
    if (violation.rule.type === 'hidden') {
      penalty *= 2;
    }
    
    // Legendary passenger rule violations are extremely severe
    if (violation.rule.difficulty === 'nightmare') {
      penalty *= 3;
    }
    
    return penalty;
  }
  
  // Check end-of-shift rule compliance
  static checkShiftEndCompliance(gameState) {
    const violations = [];
    
    // Check hidden rules that apply at shift end
    const hiddenRules = gameState.hiddenRules || [];
    hiddenRules.forEach(rule => {
      if (rule.checkViolation && rule.checkViolation(gameState)) {
        violations.push({
          rule,
          violation: rule.violationMessage || 'Hidden rule violated',
          severity: this.getRuleSeverity(rule),
          hidden: true
        });
      }
    });
    
    return violations;
  }
  
  // Get rule status for UI display
  static getRuleStatus(rule, gameState, passenger) {
    if (rule.type === 'conditional' && rule.condition) {
      const applies = rule.condition(gameState, passenger);
      return applies ? 'active' : 'inactive';
    }
    
    if (rule.type === 'hidden') {
      return gameState.revealedHiddenRules?.includes(rule.id) ? 'revealed' : 'hidden';
    }
    
    if (rule.temporary) {
      const remaining = rule.duration - (gameState.ridesCompleted || 0);
      return remaining > 0 ? 'temporary' : 'expired';
    }
    
    return 'active';
  }
}