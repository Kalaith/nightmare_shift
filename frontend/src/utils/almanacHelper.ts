import type { PlayerStats, AlmanacEntry } from '../types/game';

/**
 * Helper functions for checking Almanac knowledge levels
 */
export class AlmanacHelper {
  /**
   * Get the knowledge level for a specific passenger
   */
  static getKnowledgeLevel(playerStats: PlayerStats, passengerId: number): 0 | 1 | 2 | 3 {
    const entry: AlmanacEntry | undefined = (playerStats.almanacProgress || {})[passengerId];
    return entry?.knowledgeLevel || 0;
  }

  /**
   * Check if passenger has been encountered
   */
  static hasEncountered(playerStats: PlayerStats, passengerId: number): boolean {
    const entry: AlmanacEntry | undefined = (playerStats.almanacProgress || {})[passengerId];
    return entry?.encountered || false;
  }

  /**
   * Check if fare modifiers should be shown (Level 2+)
   */
  static canSeeFareModifiers(playerStats: PlayerStats, passengerId: number): boolean {
    return this.getKnowledgeLevel(playerStats, passengerId) >= 2;
  }

  /**
   * Check if passenger preferences should be shown (Level 2+)
   */
  static canSeePreferences(playerStats: PlayerStats, passengerId: number): boolean {
    return this.getKnowledgeLevel(playerStats, passengerId) >= 2;
  }

  /**
   * Check if risk levels should be shown (Level 3)
   */
  static canSeeRiskLevels(playerStats: PlayerStats, passengerId: number): boolean {
    return this.getKnowledgeLevel(playerStats, passengerId) >= 3;
  }
}
