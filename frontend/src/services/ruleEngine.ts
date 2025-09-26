import type {
  GuidelineException,
  Passenger,
  PassengerNeedState,
  Rule,
  RuleEvaluationResult
} from '../types/game';

const STAGE_ORDER: Record<string, number> = {
  calm: 0,
  warning: 1,
  critical: 2,
  meltdown: 3
};

export class RuleEngine {
  static evaluateAction(
    action: string,
    rules: Rule[],
    passenger: Passenger | null,
    needState: PassengerNeedState | null,
    ruleConfidence: number
  ): RuleEvaluationResult | null {
    const rule = this.findMatchingRule(action, rules);
    if (!rule) return null;

    if (rule.actionType && rule.actionType !== 'forbidden') {
      return {
        rule,
        action,
        violation: false,
        consequences: rule.followConsequences || [],
        confidenceDelta: 0,
        needAdjustment: rule.followNeedAdjustment || 0
      };
    }

    const activeException = this.findActiveException(rule, passenger, needState);

    if (activeException && activeException.breakingSafer) {
      return {
        rule,
        action,
        violation: false,
        triggeredException: activeException,
        consequences: rule.exceptionRewards || [],
        confidenceDelta: this.calculateConfidenceDelta(ruleConfidence, true),
        needAdjustment: rule.exceptionNeedAdjustment ?? -20
      };
    }

    return {
      rule,
      action,
      violation: true,
      consequences: rule.breakConsequences || [],
      confidenceDelta: this.calculateConfidenceDelta(ruleConfidence, false),
      needAdjustment: rule.breakNeedAdjustment ?? 10,
      message: rule.violationMessage || `Breaking "${rule.title}" backfired disastrously.`
    };
  }

  private static findMatchingRule(action: string, rules: Rule[]): Rule | null {
    return rules.find(rule => rule.actionKey === action) || null;
  }

  private static findActiveException(
    rule: Rule,
    passenger: Passenger | null,
    needState: PassengerNeedState | null
  ): GuidelineException | null {
    if (!rule.exceptions || rule.exceptions.length === 0) return null;
    if (!passenger?.guidelineExceptions || passenger.guidelineExceptions.length === 0) {
      return null;
    }

    for (const exception of rule.exceptions) {
      if (!passenger.guidelineExceptions.includes(exception.id)) continue;

      if (this.meetsStageRequirement(exception, needState)) {
        return exception;
      }
    }

    return null;
  }

  private static meetsStageRequirement(
    exception: GuidelineException,
    needState: PassengerNeedState | null
  ): boolean {
    if (!needState) return false;

    const requiredStage = exception.requiredStage || 'warning';
    const currentStageRank = STAGE_ORDER[needState.stage] ?? 0;
    const requiredStageRank = STAGE_ORDER[requiredStage] ?? 0;

    return currentStageRank >= requiredStageRank;
  }

  private static calculateConfidenceDelta(currentConfidence: number, correctBreak: boolean): number {
    const base = correctBreak ? 0.1 : -0.15;

    // Reward low confidence players a little more when they're right, punish reckless players harder when wrong
    if (correctBreak && currentConfidence < 0.5) {
      return base + 0.05;
    }

    if (!correctBreak && currentConfidence > 0.7) {
      return base - 0.05;
    }

    return base;
  }
}