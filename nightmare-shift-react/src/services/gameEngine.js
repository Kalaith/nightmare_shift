import { gameData } from '../data/gameData.js';
import { RARITY_WEIGHTS, GAME_CONSTANTS } from '../data/constants.js';

// Game Engine Service - handles core game logic
export class GameEngine {
  // Generate advanced shift rules with difficulty scaling
  static generateShiftRules(playerExperience = 0) {
    const difficultyLevel = Math.min(4, Math.floor(playerExperience / 10)); // 0-4 difficulty levels
    
    // Get available rule pools based on difficulty
    const basicRules = gameData.shift_rules.filter(rule => rule.type === 'basic');
    const conditionalRules = gameData.shift_rules.filter(rule => rule.type === 'conditional');
    const conflictingRules = gameData.shift_rules.filter(rule => rule.type === 'conflicting');
    const hiddenRules = gameData.shift_rules.filter(rule => rule.type === 'hidden');
    
    let selectedRules = [];
    
    // Always include 2-3 basic rules
    const shuffledBasic = [...basicRules].sort(() => 0.5 - Math.random());
    selectedRules.push(...shuffledBasic.slice(0, 2 + Math.floor(Math.random() * 2)));
    
    // Add conditional rules based on difficulty
    if (difficultyLevel >= 1) {
      const shuffledConditional = [...conditionalRules].sort(() => 0.5 - Math.random());
      selectedRules.push(...shuffledConditional.slice(0, Math.floor(Math.random() * 2) + 1));
    }
    
    // Add conflicting rules at higher difficulty
    if (difficultyLevel >= 2) {
      const shuffledConflicting = [...conflictingRules].sort(() => 0.5 - Math.random());
      const conflictingRule = shuffledConflicting[0];
      
      // Check if we can add a conflicting rule (ensure we have the rule it conflicts with)
      if (conflictingRule && conflictingRule.conflictsWith.some(id => 
        selectedRules.some(rule => rule.id === id)
      )) {
        selectedRules.push(conflictingRule);
      }
    }
    
    // Add hidden rules at expert difficulty
    if (difficultyLevel >= 3) {
      const shuffledHidden = [...hiddenRules].sort(() => 0.5 - Math.random());
      selectedRules.push(...shuffledHidden.slice(0, Math.floor(Math.random() * 2) + 1));
    }
    
    // Store both visible and hidden rules separately
    const visibleRules = selectedRules.filter(rule => rule.visible);
    const hiddenActiveRules = selectedRules.filter(rule => !rule.visible);
    
    return {
      visibleRules,
      hiddenRules: hiddenActiveRules,
      conflicts: this.findRuleConflicts(selectedRules),
      difficultyLevel
    };
  }
  
  // Helper function to identify rule conflicts
  static findRuleConflicts(rules) {
    const conflicts = [];
    rules.forEach(rule => {
      if (rule.conflictsWith) {
        rule.conflictsWith.forEach(conflictId => {
          const conflictingRule = rules.find(r => r.id === conflictId);
          if (conflictingRule) {
            conflicts.push({
              rule1: rule,
              rule2: conflictingRule,
              description: `"${rule.title}" conflicts with "${conflictingRule.title}"`
            });
          }
        });
      }
    });
    return conflicts;
  }
  
  // Check for hidden rule violations
  static checkHiddenRuleViolations(gameState, passenger) {
    const hiddenRules = gameState.hiddenRules || [];
    
    for (const rule of hiddenRules) {
      if (rule.checkViolation && rule.checkViolation(gameState)) {
        return { rule, violated: true };
      }
    }
    
    return null;
  }
  
  // Apply passenger rule modifications
  static applyRuleModification(rules, passenger) {
    if (!passenger.ruleModification) return rules;
    
    const modification = passenger.ruleModification;
    let modifiedRules = [...rules];
    
    switch (modification.type) {
      case 'remove_rule':
        // Remove a random rule (typically used by The Collector)
        if (modifiedRules.length > 0) {
          const randomIndex = Math.floor(Math.random() * modifiedRules.length);
          modifiedRules.splice(randomIndex, 1);
        }
        break;
        
      case 'add_temporary':
        // Add a temporary rule (typically used by The Midnight Mayor)
        modifiedRules.push(modification.newRule);
        break;
        
      case 'reveal_hidden':
        // Reveal a hidden rule (typically used by Madame Zelda)
        // This would need access to hidden rules from game state
        break;
        
      default:
        break;
    }
    
    return modifiedRules;
  }
  
  // Calculate player experience based on game stats
  static calculatePlayerExperience(playerStats) {
    const rides = playerStats.totalRidesCompleted || 0;
    const shifts = playerStats.totalShiftsCompleted || 0;
    return rides + (shifts * 10);
  }
  
  // Generate weather conditions for enhanced gameplay
  static generateWeatherConditions() {
    const weatherTypes = ['clear', 'fog', 'rain', 'storm'];
    const weights = [50, 25, 20, 5]; // Chance percentages
    
    const random = Math.random() * 100;
    let accumulator = 0;
    
    for (let i = 0; i < weatherTypes.length; i++) {
      accumulator += weights[i];
      if (random <= accumulator) {
        return weatherTypes[i];
      }
    }
    
    return 'clear'; // Default fallback
  }
  
  // Check if conditional rules apply
  static checkConditionalRules(rules, gameState, passenger) {
    return rules.filter(rule => {
      if (rule.type !== 'conditional') return true;
      if (!rule.condition) return true;
      return rule.condition(gameState, passenger);
    });
  }
  
  // Calculate ride duration based on locations and conditions
  static calculateRideDuration(pickup, destination, weather = 'clear') {
    const baseTime = Math.floor(Math.random() * 30) + 10; // 10-40 minutes base
    
    // Weather modifiers
    const weatherModifiers = {
      'clear': 1.0,
      'fog': 1.3,
      'rain': 1.2,
      'storm': 1.5
    };
    
    return Math.floor(baseTime * (weatherModifiers[weather] || 1.0));
  }
  
  // Calculate final score based on various factors
  static calculateFinalScore(gameState, survived) {
    const earnings = gameState.earnings || 0;
    const timeBonus = survived ? (gameState.timeRemaining || 0) * 2 : 0;
    const rideBonus = (gameState.ridesCompleted || 0) * 10;
    const survivalBonus = survived ? GAME_CONSTANTS.SURVIVAL_BONUS : 0;
    const penaltyForViolations = (gameState.rulesViolated || 0) * 10;
    
    return Math.max(0, earnings + timeBonus + rideBonus + survivalBonus - penaltyForViolations);
  }
}