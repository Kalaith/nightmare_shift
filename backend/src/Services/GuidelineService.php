<?php
declare(strict_types=1);

namespace App\Services;

/**
 * Guideline service — port of frontend guidelineEngine.ts
 * Handles guideline evaluation, exception detection, tells, and consequences.
 */
final class GuidelineService
{
    /**
     * Analyze passenger for tells related to active guidelines.
     *
     * @return array<int, array<string, mixed>> Detected tells
     */
    public function analyzePassenger(array $passenger, array $gameState, array $guidelines): array
    {
        $detectedTells = [];
        $passengerTells = $passenger['tells'] ?? [];
        $passengerId = (int) ($passenger['id'] ?? 0);

        foreach ($guidelines as $guideline) {
            $exceptions = $guideline['exceptions'] ?? [];

            foreach ($exceptions as $exception) {
                $exceptionTells = $exception['tells'] ?? [];
                $applicablePassengerIds = $exception['passengerIds'] ?? [];

                // Check if this exception applies to this passenger
                if (!empty($applicablePassengerIds) && !in_array($passengerId, $applicablePassengerIds, true)) {
                    continue;
                }

                foreach ($exceptionTells as $tell) {
                    // Match against passenger's tells
                    foreach ($passengerTells as $pTell) {
                        if (($tell['type'] ?? '') === ($pTell['type'] ?? '')) {
                            $detectedTells[] = [
                                'tell' => $pTell,
                                'passengerId' => $passengerId,
                                'detectionTime' => time(),
                                'playerNoticed' => false,
                                'relatedGuideline' => (int) ($guideline['id'] ?? 0),
                                'exceptionId' => $exception['id'] ?? null,
                            ];
                        }
                    }
                }
            }
        }

        return $detectedTells;
    }

    /**
     * Evaluate a guideline choice (follow or break).
     *
     * @return array<int, array<string, mixed>> Consequences
     */
    public function evaluateGuidelineChoice(
        int $guidelineId,
        string $choice, // 'follow' or 'break'
        array $passenger,
        array $gameState,
        array $guidelines
    ): array {
        $guideline = null;
        foreach ($guidelines as $g) {
            if (($g['id'] ?? 0) === $guidelineId) {
                $guideline = $g;
                break;
            }
        }

        if ($guideline === null) {
            return [];
        }

        // Check for active exceptions
        $activeException = $this->findActiveException($guideline, $passenger, $gameState);

        if ($choice === 'break') {
            if ($activeException !== null && ($activeException['breakingSafer'] ?? false)) {
                // Breaking was the right call — return exception rewards
                return $guideline['exceptionRewards'] ?? [];
            }
            // Breaking without exception — return break consequences
            return $this->rollConsequences($guideline['breakConsequences'] ?? []);
        }

        // Following the guideline
        if ($activeException !== null && !($activeException['breakingSafer'] ?? false)) {
            // Following was correct
            return $guideline['followConsequences'] ?? [];
        }

        return $guideline['followConsequences'] ?? [];
    }

    /**
     * Record a guideline decision for tracking.
     *
     * @return array<string, mixed> The decision record
     */
    public function recordDecision(
        int $guidelineId,
        array $passenger,
        string $action,
        array $consequences,
        array $tells,
        array $gameState
    ): array {
        return [
            'guidelineId' => $guidelineId,
            'passengerId' => (int) ($passenger['id'] ?? 0),
            'action' => $action,
            'outcome' => $consequences,
            'wasCorrect' => $this->wasDecisionCorrect($guidelineId, $action, $passenger, $gameState),
            'tellsPresent' => $tells,
            'timestamp' => time(),
        ];
    }

    // ─── Private Helpers ──────────────────────────────────────────────

    private function findActiveException(array $guideline, array $passenger, array $gameState): ?array
    {
        $exceptions = $guideline['exceptions'] ?? [];
        $passengerId = (int) ($passenger['id'] ?? 0);

        foreach ($exceptions as $exception) {
            $applicableIds = $exception['passengerIds'] ?? [];
            if (!empty($applicableIds) && !in_array($passengerId, $applicableIds, true)) {
                continue;
            }

            // Check probability
            $probability = (float) ($exception['probability'] ?? 0.5);
            if ((random_int(0, 100) / 100) <= $probability) {
                return $exception;
            }
        }

        return null;
    }

    /**
     * Roll consequences based on their individual probabilities.
     *
     * @return array<int, array<string, mixed>>
     */
    private function rollConsequences(array $consequences): array
    {
        $result = [];

        foreach ($consequences as $consequence) {
            $probability = (float) ($consequence['probability'] ?? 1.0);
            if ((random_int(0, 100) / 100) <= $probability) {
                $result[] = $consequence;
            }
        }

        return $result;
    }

    private function wasDecisionCorrect(int $guidelineId, string $action, array $passenger, array $gameState): bool
    {
        // Simplified — in a full implementation this checks exception conditions
        return $action === 'follow'; // Default: following is safe unless exception active
    }
}
