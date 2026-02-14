// Passenger related types
import type { PassengerTell, PassengerStateProfile } from './rules';

export interface RoutePreference {
  route: 'normal' | 'shortcut' | 'scenic' | 'police';
  preference: 'loves' | 'likes' | 'neutral' | 'dislikes' | 'fears';
  reason: string;
  fareModifier: number; // Multiplier for fare (0.5 = 50% fare, 1.5 = 150% fare)
  stressModifier: number; // How much this route affects their stress (-0.3 to +0.5)
  specialDialogue?: string; // What they say when you pick this route
  triggerChance?: number; // 0-1, chance they'll comment on route choice
}

export interface Passenger {
  id: number;
  name: string;
  emoji: string;
  description: string;
  pickup: string;
  destination: string;
  personalRule: string;
  supernatural: string;
  fare: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  items: string[];
  dialogue: string[];
  relationships: number[];
  backstoryUnlocked: boolean;
  backstoryDetails: string;
  tells?: PassengerTell[];
  guidelineExceptions?: string[]; // IDs of guideline exceptions this passenger triggers
  deceptionLevel?: number; // 0-1, how likely they are to lie or misdirect
  stressLevel?: number; // 0-1, current psychological state
  trustRequired?: number; // 0-1, how much player trust is needed to trigger exceptions
  routePreferences?: RoutePreference[]; // How they feel about different route choices
  ruleModification?: {
    canModify: boolean;
    type: 'remove_rule' | 'reveal_hidden' | 'add_temporary';
    description: string;
    newRule?: {
      id: number;
      title: string;
      description: string;
      difficulty: 'easy' | 'medium' | 'hard' | 'expert' | 'nightmare';
      temporary: boolean;
      duration: number;
    };
  };
  stateProfile?: PassengerStateProfile;
}

export interface PassengerReputation {
  interactions: number;
  positiveChoices: number;
  negativeChoices: number;
  lastEncounter: number;
  relationshipLevel: 'hostile' | 'neutral' | 'friendly' | 'trusted';
  specialUnlocks?: string[];
}

export interface RouteChoice {
  choice: 'normal' | 'shortcut' | 'scenic' | 'police';
  phase: 'pickup' | 'destination';
  fuelCost: number;
  timeCost: number;
  riskLevel: number;
  passenger?: number;
  timestamp: number;
}
