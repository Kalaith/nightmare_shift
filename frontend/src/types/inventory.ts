// Inventory related types

export interface InventoryItem {
    id: string;
    name: string;
    source: string;
    backstoryItem: boolean;
    type: 'protective' | 'cursed' | 'consumable' | 'tradeable' | 'story';
    rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
    description: string;
    effects?: ItemEffect[];
    durability?: number;
    maxDurability?: number;
    acquiredAt: number;
    canUse: boolean;
    canTrade: boolean;
    cursedProperties?: CursedProperties;
    protectiveProperties?: ProtectiveProperties;
}

export interface ItemEffect {
    type: 'fuel_bonus' | 'time_bonus' | 'rule_immunity' | 'supernatural_protection' |
    'fuel_drain' | 'time_penalty' | 'rule_trigger' | 'reputation_modifier';
    value: number;
    duration?: number; // in minutes, 0 = permanent while held
    condition?: string; // when this effect applies
}

export interface CursedProperties {
    penaltyType: 'fuel_drain' | 'time_acceleration' | 'forced_choices' | 'attracting_danger';
    penaltyValue: number;
    triggersAfter: number; // minutes of possession
    canBeRemoved: boolean;
    removalCondition?: string;
}

export interface ProtectiveProperties {
    protectionType: 'supernatural_immunity' | 'rule_forgiveness' | 'safe_passage' | 'lucky_encounters';
    protectionStrength: number;
    usesRemaining?: number;
    protectsAgainst?: string[]; // specific passenger IDs or rule IDs
}
