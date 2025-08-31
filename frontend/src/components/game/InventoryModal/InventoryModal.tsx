import React, { useState } from 'react';
import type { InventoryItem, GameState, Passenger } from '../../../types/game';
import { ItemService } from '../../../services/itemService';
import styles from './InventoryModal.module.css';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: InventoryItem[];
  gameState?: GameState;
  onUseItem?: (itemId: string) => void;
  onTradeItem?: (itemId: string, passenger: Passenger) => void;
  currentPassenger?: Passenger | null;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  isOpen,
  onClose,
  inventory,
  gameState,
  onUseItem,
  onTradeItem,
  currentPassenger
}) => {
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showTradeOptions, setShowTradeOptions] = useState(false);

  if (!isOpen) return null;

  const handleUseItem = (item: InventoryItem) => {
    if (item.canUse && onUseItem) {
      onUseItem(item.id);
      setSelectedItem(null);
    }
  };

  const handleTradeItem = (item: InventoryItem) => {
    if (currentPassenger && ItemService.canTradeWith(item, currentPassenger)) {
      setSelectedItem(item);
      setShowTradeOptions(true);
    }
  };

  const executeTrade = (item: InventoryItem) => {
    if (currentPassenger && onTradeItem) {
      onTradeItem(item.id, currentPassenger);
      setShowTradeOptions(false);
      setSelectedItem(null);
    }
  };

  const getItemTypeIcon = (type: InventoryItem['type']) => {
    switch (type) {
      case 'protective': return '🛡️';
      case 'cursed': return '☠️';
      case 'consumable': return '🧪';
      case 'tradeable': return '💰';
      case 'story': return '📜';
      default: return '❓';
    }
  };

  const getRarityColor = (rarity: InventoryItem['rarity']) => {
    switch (rarity) {
      case 'legendary': return styles.rarityLegendary;
      case 'rare': return styles.rarityRare;
      case 'uncommon': return styles.rarityUncommon;
      default: return styles.rarityCommon;
    }
  };

  const getDurabilityPercentage = (item: InventoryItem) => {
    if (!item.durability || !item.maxDurability) return 100;
    return (item.durability / item.maxDurability) * 100;
  };

  const tradeOptions = selectedItem && currentPassenger 
    ? ItemService.getTradeOptions(selectedItem, currentPassenger) 
    : [];

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            🎒 Inventory ({inventory.length} items)
          </h2>
          <button 
            className={styles.closeButton} 
            onClick={onClose}
            aria-label="Close inventory"
          >
            ×
          </button>
        </div>

        {showTradeOptions && selectedItem && currentPassenger ? (
          <div className={styles.tradePanel}>
            <h3 className={styles.tradePanelTitle}>
              Trade with {currentPassenger.name}
            </h3>
            <div className={styles.tradeItem}>
              <strong>Trading: {selectedItem.name}</strong>
              <p>{selectedItem.description}</p>
            </div>
            
            <div className={styles.tradeOptions}>
              {tradeOptions.map((option, index) => (
                <div key={index} className={styles.tradeOption}>
                  <button
                    className={styles.tradeButton}
                    onClick={() => executeTrade(selectedItem)}
                  >
                    {option.description}
                  </button>
                  {option.consequence && (
                    <p className={styles.tradeConsequence}>
                      ⚠️ {option.consequence}
                    </p>
                  )}
                </div>
              ))}
            </div>
            
            <button
              className={styles.cancelTradeButton}
              onClick={() => {
                setShowTradeOptions(false);
                setSelectedItem(null);
              }}
            >
              Cancel Trade
            </button>
          </div>
        ) : (
          <div className={styles.inventoryList}>
            {inventory.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🎒</div>
                <p>Your inventory is empty</p>
                <p className={styles.emptyHint}>
                  Complete rides with passengers to collect their belongings
                </p>
              </div>
            ) : (
              <div className={styles.itemList}>
                {inventory.map((item) => {
                  const durabilityPercent = getDurabilityPercentage(item);
                  const isDeterioring = durabilityPercent < 50;
                  const isBroken = durabilityPercent <= 0;
                  
                  return (
                    <div 
                      key={item.id} 
                      className={`${styles.inventoryItem} ${isBroken ? styles.brokenItem : ''}`}
                    >
                      <div className={styles.itemHeader}>
                        <div className={styles.itemTitle}>
                          <span className={styles.itemIcon}>
                            {getItemTypeIcon(item.type)}
                          </span>
                          <span className={styles.itemName}>{item.name}</span>
                          <span className={`${styles.rarityBadge} ${getRarityColor(item.rarity)}`}>
                            {item.rarity}
                          </span>
                        </div>
                        <div className={styles.itemMeta}>
                          <span className={styles.itemSource}>
                            from {item.source}
                          </span>
                        </div>
                      </div>

                      <p className={styles.itemDescription}>{item.description}</p>

                      {/* Durability bar */}
                      {item.durability && item.maxDurability && (
                        <div className={styles.durabilityContainer}>
                          <div className={styles.durabilityLabel}>
                            Condition: {item.durability}/{item.maxDurability}
                          </div>
                          <div className={styles.durabilityBar}>
                            <div 
                              className={`${styles.durabilityFill} ${
                                isDeterioring ? styles.durabilityLow : ''
                              }`}
                              style={{ width: `${durabilityPercent}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Item effects */}
                      {item.effects && item.effects.length > 0 && (
                        <div className={styles.effectsList}>
                          <strong>Effects:</strong>
                          {item.effects.map((effect, index) => (
                            <span key={index} className={styles.effect}>
                              {effect.type.replace('_', ' ')}: {effect.value > 0 ? '+' : ''}{effect.value}
                              {effect.duration ? ` (${effect.duration}min)` : ''}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Curse warning */}
                      {item.cursedProperties && (
                        <div className={styles.curseWarning}>
                          ⚠️ Cursed: {item.cursedProperties.penaltyType.replace('_', ' ')}
                          {item.cursedProperties.canBeRemoved && (
                            <span className={styles.curseRemoval}>
                              (Can be removed: {item.cursedProperties.removalCondition})
                            </span>
                          )}
                        </div>
                      )}

                      {/* Protection info */}
                      {item.protectiveProperties && (
                        <div className={styles.protectionInfo}>
                          🛡️ Protection: {item.protectiveProperties.protectionType.replace('_', ' ')}
                          {item.protectiveProperties.usesRemaining && (
                            <span className={styles.usesRemaining}>
                              ({item.protectiveProperties.usesRemaining} uses left)
                            </span>
                          )}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className={styles.itemActions}>
                        {item.canUse && !isBroken && (
                          <button
                            className={styles.useButton}
                            onClick={() => handleUseItem(item)}
                          >
                            Use
                          </button>
                        )}
                        
                        {item.canTrade && currentPassenger && 
                         ItemService.canTradeWith(item, currentPassenger) && (
                          <button
                            className={styles.tradeButton}
                            onClick={() => handleTradeItem(item)}
                          >
                            Trade with {currentPassenger.name}
                          </button>
                        )}

                        {item.backstoryItem && (
                          <span className={styles.backstoryBadge}>
                            📖 Story Item
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className={styles.modalActions}>
          <button 
            className={styles.actionButton} 
            onClick={onClose}
          >
            Close Inventory
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryModal;