<?php
declare(strict_types=1);

namespace App\Services;

use App\Data\Constants;
use App\External\GameContentRepository;

/**
 * Core game engine — port of frontend gameEngine.ts
 * Handles rule generation, violation checking, and scoring.
 * Reads all game data from the database via GameContentRepository.
 */
final class GameEngineService
{
    public function __construct(
        private readonly GameContentRepository $contentRepo
    ) {}

    /**
     * Calculate player experience from stats.
     */
    public function calculatePlayerExperience(array $playerStats): int
    {
        $shiftsCompleted = (int) ($playerStats['total_shifts_completed'] ?? 0);
        $ridesCompleted = (int) ($playerStats['total_rides_completed'] ?? 0);
        return $shiftsCompleted * 2 + $ridesCompleted;
    }

    /**
     * Generate rules for a shift based on player experience.
     *
     * @return array{visibleRules: array, hiddenRules: array, difficultyLevel: int, guidelines?: array}
     */
    public function generateShiftRules(int $playerExperience = 0): array
    {
        $difficultyLevel = min(4, intdiv($playerExperience, 10));

        // Use guidelines system for experienced players
        if ($playerExperience >= 20) {
            return $this->generateShiftGuidelines($playerExperience, $difficultyLevel);
        }

        // Read rules from database
        $basicRules = $this->contentRepo->getRulesByType('basic');
        $conditionalRules = $this->contentRepo->getRulesByType('conditional');
        $hiddenRules = $this->contentRepo->getRulesByType('hidden');
        $conflictingRules = $this->contentRepo->getRulesByType('conflicting');

        $selectedRules = [];

        // Always include 2-3 basic rules
        shuffle($basicRules);
        $numBasic = 2 + (random_int(0, 1));
        $selectedRules = array_merge($selectedRules, array_slice($basicRules, 0, $numBasic));

        // Add conditional rules based on difficulty
        if ($difficultyLevel >= 1) {
            shuffle($conditionalRules);
            $numConditional = random_int(1, 2);
            $selectedRules = array_merge($selectedRules, array_slice($conditionalRules, 0, $numConditional));
        }

        // Add conflicting rules at higher difficulty
        if ($difficultyLevel >= 2 && !empty($conflictingRules)) {
            shuffle($conflictingRules);
            $selectedRules[] = $conflictingRules[0];
        }

        // Add hidden rules at higher difficulty
        $selectedHidden = [];
        if ($difficultyLevel >= 1 && !empty($hiddenRules)) {
            shuffle($hiddenRules);
            $numHidden = min(count($hiddenRules), random_int(1, 2));
            $selectedHidden = array_slice($hiddenRules, 0, $numHidden);
        }

        $visibleRules = array_values(array_filter($selectedRules, fn($r) => ($r['visible'] ?? true)));

        return [
            'visibleRules' => $visibleRules,
            'hiddenRules' => $selectedHidden,
            'difficultyLevel' => $difficultyLevel,
        ];
    }

    /**
     * Generate guidelines for experienced players.
     *
     * @return array{visibleRules: array, hiddenRules: array, difficultyLevel: int, guidelines: array}
     */
    public function generateShiftGuidelines(int $playerExperience, int $difficultyLevel): array
    {
        // For guidelines, use the basic rules that have guideline data
        $allRules = $this->contentRepo->getAllRules();
        $guidelines = array_values(array_filter($allRules, fn($r) =>
            isset($r['relatedGuidelineId']) &&
            !empty($r['exceptions']) &&
            !empty($r['followConsequences'])
        ));

        $numGuidelines = min(6, 3 + $difficultyLevel);
        shuffle($guidelines);
        $selectedGuidelines = array_slice($guidelines, 0, $numGuidelines);

        // Convert guidelines to rules for compatibility
        $visibleRules = array_map(function ($guideline) {
            return [
                'id' => $guideline['id'],
                'title' => $guideline['title'],
                'description' => $guideline['description'],
                'difficulty' => $guideline['difficulty'] ?? 'medium',
                'type' => $guideline['type'] ?? 'basic',
                'visible' => $guideline['visible'] ?? true,
                'conflictsWith' => $guideline['conflictsWith'] ?? [],
                'trigger' => $guideline['trigger'] ?? null,
                'violationMessage' => $guideline['violationMessage'] ?? null,
                'actionKey' => $guideline['actionKey'] ?? null,
                'actionType' => $guideline['actionType'] ?? null,
                'defaultSafety' => $guideline['defaultSafety'] ?? 'safe',
                'defaultOutcome' => $guideline['defaultOutcome'] ?? null,
                'exceptions' => $guideline['exceptions'] ?? [],
                'followConsequences' => $guideline['followConsequences'] ?? [],
                'breakConsequences' => $guideline['breakConsequences'] ?? [],
                'exceptionRewards' => $guideline['exceptionRewards'] ?? [],
                'relatedGuidelineId' => $guideline['id'],
            ];
        }, $selectedGuidelines);

        return [
            'visibleRules' => $visibleRules,
            'hiddenRules' => [],
            'difficultyLevel' => $difficultyLevel,
            'guidelines' => $selectedGuidelines,
        ];
    }

    /**
     * Check if an action violates any current rules.
     *
     * @return array|null The violated rule, or null
     */
    public function checkRuleViolation(array $gameState, string $action): ?array
    {
        $guidelines = $gameState['currentGuidelines'] ?? null;
        $currentPassenger = $gameState['currentPassenger'] ?? null;

        if ($guidelines !== null && $currentPassenger !== null) {
            return $this->checkGuidelineViolation($gameState, $action);
        }

        $rules = $gameState['currentRules'] ?? [];
        foreach ($rules as $rule) {
            if ($this->isRuleViolated($rule, $gameState, $action)) {
                return $rule;
            }
        }

        return null;
    }

    /**
     * Check guideline violation with exception handling.
     */
    public function checkGuidelineViolation(array $gameState, string $action): ?array
    {
        $guidelines = $gameState['currentGuidelines'] ?? [];
        $currentPassenger = $gameState['currentPassenger'] ?? null;

        if (empty($guidelines) || $currentPassenger === null) {
            return null;
        }

        $relevantGuideline = $this->findRelevantGuideline($guidelines, $action);
        if ($relevantGuideline === null) {
            return null;
        }

        if ($this->isGuidelineBreaking($action)) {
            $breakConsequences = $relevantGuideline['breakConsequences'] ?? [];
            $hasDeathConsequence = false;
            foreach ($breakConsequences as $consequence) {
                if (($consequence['type'] ?? '') === 'death') {
                    $hasDeathConsequence = true;
                    break;
                }
            }

            if ($hasDeathConsequence && (random_int(0, 100) / 100) < 0.7) {
                return $relevantGuideline;
            }
        }

        return null;
    }

    /**
     * Check hidden rule violations for a passenger.
     */
    public function checkHiddenRuleViolations(array $gameState, array $passenger): ?array
    {
        $hiddenRules = $gameState['hiddenRules'] ?? [];

        foreach ($hiddenRules as $rule) {
            if ($this->isHiddenRuleViolated($rule, $gameState, $passenger)) {
                return ['rule' => $rule];
            }
        }

        return null;
    }

    /**
     * Calculate score from shift results.
     */
    public function calculateScore(float $earnings, int $ridesCompleted, float $timeSpent): int
    {
        return (int) round($earnings * 0.4 + $ridesCompleted * 20 + $timeSpent * 0.1);
    }

    private function isRuleViolated(array $rule, array $gameState, string $action): bool
    {
        // Dynamic check: match action against rule's actionKey
        $actionKey = $rule['actionKey'] ?? null;
        $actionType = $rule['actionType'] ?? null;

        if ($actionKey !== null && $actionKey === $action && $actionType === 'forbidden') {
            return true;
        }

        return false;
    }

    private function isHiddenRuleViolated(array $rule, array $gameState, array $passenger): bool
    {
        return false; // Simplified for initial implementation
    }

    private function findRelevantGuideline(array $guidelines, string $action): ?array
    {
        // Dynamically find guideline by action key instead of hardcoded map
        foreach ($guidelines as $guideline) {
            if (($guideline['actionKey'] ?? null) === $action) {
                return $guideline;
            }
        }

        return null;
    }

    private function isGuidelineBreaking(string $action): bool
    {
        $breakingActions = [
            'eye_contact', 'take_shortcut', 'accept_tip',
            'speak_first', 'stop_car', 'open_window', 'take_detour',
        ];
        return in_array($action, $breakingActions, true);
    }
}
