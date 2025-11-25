import type { InventoryItem, ItemEffect, CursedProperties, ProtectiveProperties, GameState, Passenger } from '../types/game';
import { GAME_BALANCE } from '../constants/gameBalance';
import { ErrorHandling, type GameResult } from '../utils/errorHandling';

export class ItemService {
  /**
   * Create enhanced inventory item from passenger item
   */
  static createInventoryItem(
    itemName: string, 
    passengerSource: string, 
    isBackstory: boolean = false
  ): GameResult<InventoryItem> {
    return ErrorHandling.wrap(
      () => {
        const itemData = this.getItemData(itemName);
        const item: InventoryItem = {
          id: `${itemName}_${Date.now()}_${Math.random()}`,
          name: itemName,
          source: passengerSource,
          backstoryItem: isBackstory,
          type: itemData.type || 'story',
          rarity: itemData.rarity || 'common',
          description: itemData.description || 'A mysterious item',
          effects: itemData.effects,
          durability: itemData.maxDurability,
          maxDurability: itemData.maxDurability,
          acquiredAt: Date.now(),
          canUse: itemData.canUse ?? false,
          canTrade: itemData.canTrade ?? false,
          cursedProperties: itemData.cursedProperties,
          protectiveProperties: itemData.protectiveProperties
        };
        return item;
      },
      'item_creation_failed',
      this.createFallbackItem(itemName, passengerSource)
    );
  }

  /**
   * Apply item effects to game state
   */
  static applyItemEffects(gameState: GameState, item: InventoryItem): GameResult<GameState> {
    return ErrorHandling.wrap(
      () => {
        if (!item.effects) return gameState;

        let newState = { ...gameState };

        for (const effect of item.effects) {
          switch (effect.type) {
            case 'fuel_bonus':
              newState.fuel = Math.min(100, newState.fuel + effect.value);
              break;
            case 'fuel_drain':
              newState.fuel = Math.max(0, newState.fuel - effect.value);
              break;
            case 'time_bonus':
              newState.timeRemaining = Math.min(480, newState.timeRemaining + effect.value);
              break;
            case 'time_penalty':
              newState.timeRemaining = Math.max(0, newState.timeRemaining - effect.value);
              break;
            case 'reputation_modifier':
              // Apply to current passenger if exists
              if (newState.currentPassenger) {
                const currentRep = newState.passengerReputation[newState.currentPassenger.id];
                if (currentRep) {
                  currentRep.positiveChoices += effect.value;
                }
              }
              break;
          }
        }

        return newState;
      },
      'item_effect_application_failed',
      gameState
    );
  }

  /**
   * Check for cursed item penalties
   */
  static applyCursedEffects(gameState: GameState): GameResult<GameState> {
    return ErrorHandling.wrap(
      () => {
        const currentTime = Date.now();
        let newState = { ...gameState };

        for (const item of gameState.inventory) {
          if (item.cursedProperties && this.shouldTriggerCurse(item, currentTime)) {
            newState = this.applyCurse(newState, item);
          }
        }

        return newState;
      },
      'cursed_effects_failed',
      gameState
    );
  }

  /**
   * Check if item can protect against specific threat
   */
  static canProtectAgainst(item: InventoryItem, threat: string): boolean {
    if (!item.protectiveProperties || !item.protectiveProperties.usesRemaining) {
      return false;
    }

    if (item.protectiveProperties.protectsAgainst) {
      return item.protectiveProperties.protectsAgainst.includes(threat);
    }

    return item.protectiveProperties.protectionType === 'supernatural_immunity';
  }

  /**
   * Use protective item
   */
  static useProtectiveItem(item: InventoryItem): InventoryItem {
    if (item.protectiveProperties?.usesRemaining) {
      return {
        ...item,
        protectiveProperties: {
          ...item.protectiveProperties,
          usesRemaining: item.protectiveProperties.usesRemaining - 1
        }
      };
    }
    return item;
  }

  /**
   * Check if item can be traded with passenger
   */
  static canTradeWith(item: InventoryItem, passenger: Passenger): boolean {
    if (!item.canTrade) return false;
    
    // Special passengers have specific trading preferences
    switch (passenger.id) {
      case 5: // The Collector
        return true; // Collector trades for anything
      case 11: // Madame Zelda
        return item.type === 'story' || item.rarity === 'rare';
      case 13: // Sister Agnes
        return item.type === 'cursed'; // Will take cursed items to purify them
      default:
        return item.type === 'tradeable';
    }
  }

  /**
   * Process item deterioration over time
   */
  static processItemDeterioration(inventory: InventoryItem[]): InventoryItem[] {
    const currentTime = Date.now();

    return inventory
      .map(item => {
        if (item.durability && item.maxDurability) {
          const ageMinutes = (currentTime - item.acquiredAt) / (60 * 1000);
          
          if (ageMinutes > 10) { // Start deteriorating after 10 minutes
            const deterioration = Math.floor(ageMinutes / 10);
            const newDurability = Math.max(0, item.durability - deterioration);
            
            return {
              ...item,
              durability: newDurability
            };
          }
        }
        return item;
      })
      .filter(item => !item.durability || item.durability > 0); // Remove broken items
  }

  /**
   * Get possible trade outcomes with passenger
   */
  static getTradeOptions(item: InventoryItem, passenger: Passenger): Array<{
    give: InventoryItem;
    receive: InventoryItem | null;
    description: string;
    consequence?: string;
  }> {
    const options = [];

    switch (passenger.id) {
      case 5: { // The Collector
        const wardResult = this.createInventoryItem('soul protection ward', 'The Collector');
        if (wardResult.success) {
          options.push({
            give: item,
            receive: wardResult.data,
            description: 'Trade for supernatural protection',
            consequence: 'The Collector remembers your deal'
          });
        }
        break;
      }
        
      case 11: // Madame Zelda
        if (item.type === 'story') {
          options.push({
            give: item,
            receive: null,
            description: 'Trade for knowledge of hidden rules',
            consequence: 'Reveals a hidden rule but asks for future favor'
          });
        }
        break;
        
      case 13: { // Sister Agnes
        if (item.type === 'cursed') {
          const medallionResult = this.createInventoryItem('blessed medallion', 'Sister Agnes');
          if (medallionResult.success) {
            options.push({
              give: item,
              receive: medallionResult.data,
              description: 'Purify cursed object for protection',
              consequence: 'Removes curse and grants protection'
            });
          }
        }
        break;
      }
    }

    return options;
  }

  // Private helper methods
  private static getItemData(itemName: string): Partial<InventoryItem> {
    const itemDatabase: Record<string, Partial<InventoryItem>> = {
      'old locket': {
        type: 'cursed',
        rarity: 'uncommon',
        description: 'A tarnished locket that whispers forgotten names',
        canUse: false,
        canTrade: true,
        cursedProperties: {
          penaltyType: 'attracting_danger',
          penaltyValue: 1,
          triggersAfter: 20,
          canBeRemoved: true,
          removalCondition: 'Trade with Sister Agnes or complete passenger backstory'
        },
        maxDurability: 100
      },
      'crystal pendant': {
        type: 'protective',
        rarity: 'rare',
        description: 'A shimmering crystal that wards off supernatural influence',
        canUse: true,
        canTrade: true,
        protectiveProperties: {
          protectionType: 'supernatural_immunity',
          protectionStrength: 2,
          usesRemaining: 3
        },
        effects: [
          { type: 'rule_immunity', value: 1, duration: 30, condition: 'supernatural_encounter' }
        ]
      },
      'withered flowers': {
        type: 'story',
        rarity: 'common',
        description: 'Flowers that never truly die, holding memories of the past',
        canUse: false,
        canTrade: false,
        maxDurability: 50
      },
      'blessed medallion': {
        type: 'protective',
        rarity: 'rare',
        description: 'A holy medallion that repels dark influences',
        canUse: true,
        canTrade: false,
        protectiveProperties: {
          protectionType: 'supernatural_immunity',
          protectionStrength: 3,
          usesRemaining: 5
        },
        effects: [
          { type: 'supernatural_protection', value: 3, duration: 0 }
        ]
      },
      'soul protection ward': {
        type: 'protective',
        rarity: 'legendary',
        description: 'A ward crafted by The Collector, protecting your very essence',
        canUse: true,
        canTrade: false,
        protectiveProperties: {
          protectionType: 'supernatural_immunity',
          protectionStrength: 5,
          usesRemaining: 1,
          protectsAgainst: ['16'] // Death's Taxi Driver
        }
      }
    };

    return itemDatabase[itemName] || this.getDefaultItemData();
  }

  private static getDefaultItemData(): Partial<InventoryItem> {
    return {
      type: 'story',
      rarity: 'common',
      description: 'A mysterious object left behind by a passenger',
      canUse: false,
      canTrade: false,
      maxDurability: 100
    };
  }

  private static createFallbackItem(name: string, source: string): InventoryItem {
    return {
      id: `${name}_${Date.now()}`,
      name,
      source,
      backstoryItem: false,
      type: 'story',
      rarity: 'common',
      description: 'A mysterious object',
      acquiredAt: Date.now(),
      canUse: false,
      canTrade: false
    };
  }

  private static shouldTriggerCurse(item: InventoryItem, currentTime: number): boolean {
    if (!item.cursedProperties) return false;
    
    const possessionTime = (currentTime - item.acquiredAt) / (60 * 1000);
    return possessionTime >= item.cursedProperties.triggersAfter;
  }

  private static applyCurse(gameState: GameState, item: InventoryItem): GameState {
    if (!item.cursedProperties) return gameState;

    const newState = { ...gameState };
    const curse = item.cursedProperties;

    switch (curse.penaltyType) {
      case 'fuel_drain':
        newState.fuel = Math.max(0, newState.fuel - curse.penaltyValue);
        break;
      case 'time_acceleration':
        newState.timeRemaining = Math.max(0, newState.timeRemaining - curse.penaltyValue);
        break;
      case 'attracting_danger':
        // Increase supernatural encounter probability (handled elsewhere)
        break;
    }

    return newState;
  }
}