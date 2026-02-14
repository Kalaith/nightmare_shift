import type {
  DetectedTell,
  Passenger,
  PassengerNeedStage,
  PassengerNeedState,
  PassengerStateProfile,
  PassengerTell,
  RuleEvaluationResult,
} from '../types/game';

interface TriggeredTell {
  tell: PassengerTell;
  stage: PassengerNeedStage;
  exceptionId?: string;
  relatedGuidelineId?: number;
}

const STAGE_ORDER: Record<PassengerNeedStage, number> = {
  calm: 0,
  warning: 1,
  critical: 2,
  meltdown: 3,
};

const DEFAULT_TELL_INTENSITIES: Record<
  PassengerNeedStage,
  Array<'subtle' | 'moderate' | 'obvious'>
> = {
  calm: ['subtle'],
  warning: ['moderate'],
  critical: ['obvious'],
  meltdown: ['obvious'],
};

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

export class PassengerStateMachine {
  static initialize(passenger: Passenger | null): PassengerNeedState | null {
    if (!passenger?.stateProfile) return null;

    const profile = passenger.stateProfile;
    const stage = this.calculateStage(profile.initialLevel, profile.thresholds);

    return {
      passengerId: passenger.id,
      needType: profile.needType,
      level: clamp(profile.initialLevel, 0, 100),
      stage,
      stability: this.calculateStability(profile.initialLevel),
      lastUpdated: Date.now(),
      revealedStages: stage === 'calm' ? {} : { [stage]: true },
      profile,
    };
  }

  static applyRouteChoice(
    state: PassengerNeedState | null,
    passenger: Passenger | null,
    routeChoice: 'normal' | 'shortcut' | 'scenic' | 'police',
    ruleOutcome?: RuleEvaluationResult | null
  ): { state: PassengerNeedState | null; triggeredTells: TriggeredTell[] } {
    if (!state || !passenger?.stateProfile) {
      return { state, triggeredTells: [] };
    }

    const profile = passenger.stateProfile;

    let level = state.level + (profile.needChange.passive || 0);

    if (routeChoice === 'shortcut') {
      level += profile.needChange.break || 0;
    } else {
      level += profile.needChange.obey || 0;
    }

    if (ruleOutcome) {
      level += ruleOutcome.needAdjustment;
    }

    level = clamp(level, 0, 100);
    const stage = this.calculateStage(level, profile.thresholds);

    const triggeredTells = this.collectTells(passenger, state, stage, ruleOutcome);

    const updatedState: PassengerNeedState = {
      ...state,
      level,
      stage,
      stability: this.calculateStability(level),
      lastUpdated: Date.now(),
      revealedStages: {
        ...state.revealedStages,
        ...(stage !== 'calm' ? { [stage]: true } : {}),
      },
    };

    return { state: updatedState, triggeredTells };
  }

  static getDialogueForStage(
    passenger: Passenger | null,
    state: PassengerNeedState | null
  ): string | null {
    if (!passenger || !state?.profile) return null;

    const profile = state.profile;
    const lines = profile.dialogueByStage?.[state.stage];
    if (lines && lines.length > 0) {
      return lines[Math.floor(Math.random() * lines.length)];
    }

    return null;
  }

  static mergeDetectedTells(
    existing: DetectedTell[] = [],
    triggered: TriggeredTell[],
    passengerId: number
  ): DetectedTell[] {
    if (triggered.length === 0) return existing;

    const timestamp = Date.now();
    const merged = triggered.map(trigger => ({
      tell: trigger.tell,
      passengerId,
      detectionTime: timestamp,
      playerNoticed: false,
      relatedGuideline: trigger.relatedGuidelineId ?? 0,
      exceptionId: trigger.exceptionId,
    }));

    return [...existing, ...merged];
  }

  static isExceptionActive(
    state: PassengerNeedState | null,
    exceptionId: string | undefined
  ): boolean {
    if (!state || !exceptionId || !state.profile?.exceptionId) return false;
    return (
      state.profile.exceptionId === exceptionId && STAGE_ORDER[state.stage] >= STAGE_ORDER.warning
    );
  }

  private static calculateStage(
    level: number,
    thresholds: PassengerStateProfile['thresholds']
  ): PassengerNeedStage {
    if (level >= thresholds.meltdown) return 'meltdown';
    if (level >= thresholds.critical) return 'critical';
    if (level >= thresholds.warning) return 'warning';
    return 'calm';
  }

  private static calculateStability(level: number): number {
    return clamp(1 - level / 100, 0, 1);
  }

  private static collectTells(
    passenger: Passenger,
    previousState: PassengerNeedState,
    stage: PassengerNeedStage,
    ruleOutcome?: RuleEvaluationResult | null
  ): TriggeredTell[] {
    if (!passenger.tells || passenger.tells.length === 0) return [];

    const alreadyRevealed = previousState.revealedStages?.[stage];
    if (alreadyRevealed) return [];

    const intensities =
      previousState.profile.tellIntensities?.[stage] || DEFAULT_TELL_INTENSITIES[stage];

    const tells = passenger.tells.filter(tell => intensities.includes(tell.intensity));

    if (tells.length === 0) return [];

    return tells.map(tell => ({
      tell,
      stage,
      exceptionId: ruleOutcome?.triggeredException?.id,
      relatedGuidelineId: ruleOutcome?.rule.relatedGuidelineId,
    }));
  }
}
