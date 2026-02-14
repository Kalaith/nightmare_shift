// Rule and Guideline related types
import type { GameState } from './gameState';
import type { Passenger } from './passenger';

export interface Rule {
  id: number;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert' | 'nightmare';
  type: 'basic' | 'conditional' | 'conflicting' | 'hidden' | 'weather';
  visible: boolean;
  actionKey?: string;
  actionType?: 'forbidden' | 'required';
  relatedGuidelineId?: number;
  defaultSafety?: 'safe' | 'risky' | 'dangerous';
  defaultOutcome?: string;
  exceptions?: GuidelineException[];
  followConsequences?: GuidelineConsequence[];
  breakConsequences?: GuidelineConsequence[];
  exceptionRewards?: GuidelineConsequence[];
  exceptionNeedAdjustment?: number;
  followNeedAdjustment?: number;
  breakNeedAdjustment?: number;
  conflictsWith?: number[];
  trigger?: string;
  violationMessage?: string;
  condition?: (gameState: GameState, passenger: Passenger) => boolean;
  conditionHint?: string;
  checkViolation?: (gameState: GameState) => boolean;
  temporary?: boolean;
  duration?: number;
}

export interface Guideline extends Rule {
  isGuideline: true;
  exceptions: GuidelineException[];
  defaultSafety: 'safe' | 'risky' | 'dangerous';
  breakConsequences: GuidelineConsequence[];
  followConsequences: GuidelineConsequence[];
  exceptionRewards?: GuidelineConsequence[];
}

export interface GuidelineException {
  id: string;
  passengerIds?: number[];
  passengerTypes?: string[];
  conditions: ExceptionCondition[];
  tells: PassengerTell[];
  breakingSafer: boolean;
  description: string;
  probability: number;
  requiredStage?: PassengerNeedStage;
}

export interface ExceptionCondition {
  type: 'passenger_dialogue' | 'passenger_behavior' | 'environmental' | 'time_based' | 'weather';
  value: string | number;
  operator?: 'equals' | 'contains' | 'greater_than' | 'less_than';
  description: string;
}

export interface PassengerTell {
  type: 'verbal' | 'behavioral' | 'visual' | 'environmental';
  intensity: 'subtle' | 'moderate' | 'obvious';
  description: string;
  triggerPhrase?: string;
  animationCue?: string;
  audioCue?: string;
  reliability: number; // 0-1, how trustworthy this tell is
}

export interface GuidelineConsequence {
  type: 'death' | 'survival' | 'reputation' | 'money' | 'fuel' | 'time' | 'item' | 'story_unlock';
  value: number;
  description: string;
  probability: number;
}

export type PassengerNeedStage = 'calm' | 'warning' | 'critical' | 'meltdown';

export interface NeedChangeProfile {
  passive: number;
  obey: number;
  break: number;
  exceptionRelief: number;
}

export interface PassengerStateProfile {
  needType: 'hunger' | 'fear' | 'wrath' | 'decay' | 'loneliness' | 'unknown';
  initialLevel: number; // 0-100 scale
  thresholds: {
    warning: number;
    critical: number;
    meltdown: number;
  };
  needChange: NeedChangeProfile;
  exceptionId?: string;
  tellIntensities?: Partial<Record<PassengerNeedStage, Array<'subtle' | 'moderate' | 'obvious'>>>;
  dialogueByStage?: Partial<Record<PassengerNeedStage, string[]>>;
  trustImpact?: Partial<Record<PassengerNeedStage, number>>;
  confidenceImpact?: Partial<Record<PassengerNeedStage, number>>;
}

export interface PassengerNeedState {
  passengerId: number;
  needType: PassengerStateProfile['needType'];
  level: number;
  stage: PassengerNeedStage;
  stability: number; // 0-1 scale
  lastUpdated: number;
  revealedStages: Partial<Record<PassengerNeedStage, boolean>>;
  profile: PassengerStateProfile;
}

export interface RuleEvaluationResult {
  rule: Rule;
  action: string;
  violation: boolean;
  triggeredException?: GuidelineException;
  consequences: GuidelineConsequence[];
  confidenceDelta: number;
  needAdjustment: number;
  message?: string;
}

export interface RuleConflict {
  rule1: Rule;
  rule2: Rule;
  conflictType: 'direct' | 'indirect' | 'conditional';
  description: string;
}

export interface HiddenRuleViolation {
  rule: Rule;
}

export interface GuidelineDecision {
  guidelineId: number;
  passengerId: number;
  action: 'follow' | 'break';
  outcome: GuidelineConsequence[];
  wasCorrect: boolean;
  tellsPresent: PassengerTell[];
  playerReason?: string;
  timestamp: number;
}

export interface DetectedTell {
  tell: PassengerTell;
  passengerId: number;
  detectionTime: number;
  playerNoticed: boolean;
  relatedGuideline: number;
  exceptionId?: string;
}
