<?php
declare(strict_types=1);

namespace App\Services;

/**
 * Reputation service — port of frontend ReputationService class
 * Tracks passenger reputation and modifiers.
 */
final class ReputationService
{
    /**
     * Initialize empty reputation map.
     *
     * @return array<int, array<string, mixed>>
     */
    public function initializeReputation(): array
    {
        return [];
    }

    /**
     * Get reputation for a specific passenger.
     *
     * @return array<string, mixed>
     */
    public function getPassengerReputation(array $reputationMap, int $passengerId): array
    {
        return $reputationMap[$passengerId] ?? [
            'interactions' => 0,
            'positiveChoices' => 0,
            'negativeChoices' => 0,
            'lastEncounter' => 0,
            'relationshipLevel' => 'neutral',
            'specialUnlocks' => [],
        ];
    }

    /**
     * Update reputation after an interaction.
     *
     * @return array<int, array<string, mixed>> Updated reputation map
     */
    public function updateReputation(
        array $reputationMap,
        int $passengerId,
        bool $isPositive,
        int $timestamp = 0
    ): array {
        $timestamp = $timestamp ?: time();
        $current = $this->getPassengerReputation($reputationMap, $passengerId);

        $current['interactions']++;
        $current['lastEncounter'] = $timestamp;

        if ($isPositive) {
            $current['positiveChoices']++;
        } else {
            $current['negativeChoices']++;
        }

        // Calculate relationship level
        $total = $current['positiveChoices'] + $current['negativeChoices'];
        if ($total > 0) {
            $ratio = $current['positiveChoices'] / $total;
            if ($ratio >= 0.8 && $current['interactions'] >= 3) {
                $current['relationshipLevel'] = 'trusted';
            } elseif ($ratio >= 0.6) {
                $current['relationshipLevel'] = 'friendly';
            } elseif ($ratio <= 0.3) {
                $current['relationshipLevel'] = 'hostile';
            } else {
                $current['relationshipLevel'] = 'neutral';
            }
        }

        $reputationMap[$passengerId] = $current;
        return $reputationMap;
    }

    /**
     * Get fare/risk modifiers based on reputation.
     *
     * @return array{fareMultiplier: float, riskModifier: float, specialOptions: string[]}
     */
    public function getReputationModifier(array $reputation): array
    {
        $level = $reputation['relationshipLevel'] ?? 'neutral';

        return match ($level) {
            'trusted' => [
                'fareMultiplier' => 1.3,
                'riskModifier' => 0.7,
                'specialOptions' => ['secret_route', 'backstory_hint'],
            ],
            'friendly' => [
                'fareMultiplier' => 1.15,
                'riskModifier' => 0.85,
                'specialOptions' => ['backstory_hint'],
            ],
            'hostile' => [
                'fareMultiplier' => 0.8,
                'riskModifier' => 1.3,
                'specialOptions' => [],
            ],
            default => [
                'fareMultiplier' => 1.0,
                'riskModifier' => 1.0,
                'specialOptions' => [],
            ],
        };
    }
}
