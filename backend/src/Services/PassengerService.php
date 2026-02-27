<?php
declare(strict_types=1);

namespace App\Services;

use App\Data\Constants;
use App\External\GameContentRepository;

/**
 * Passenger service — port of frontend passengerService.ts
 * Handles passenger selection, rarity weighting, and environmental awareness.
 * Reads all passenger data from the database via GameContentRepository.
 */
final class PassengerService
{
    public function __construct(
        private readonly GameContentRepository $contentRepo
    ) {}

    /**
     * Select a random passenger considering used list and difficulty.
     *
     * @param int[] $usedPassengers
     * @return array<string, mixed>|null
     */
    public function selectRandomPassenger(array $usedPassengers = [], int $difficultyLevel = 0): ?array
    {
        $available = $this->contentRepo->getAvailablePassengers($usedPassengers);

        if (empty($available)) {
            // All passengers used, reset pool
            $available = $this->contentRepo->getAllPassengers();
        }

        return $this->selectByRarity($available, $difficultyLevel);
    }

    /**
     * Select passenger considering weather and environmental conditions.
     *
     * @param int[] $usedPassengers
     * @return array<string, mixed>|null
     */
    public function selectWeatherAwarePassenger(
        array $usedPassengers = [],
        int $difficultyLevel = 0,
        array $weather = [],
        array $timeOfDay = [],
        array $season = []
    ): ?array {
        $available = $this->contentRepo->getAvailablePassengers($usedPassengers);

        if (empty($available)) {
            $available = $this->contentRepo->getAllPassengers();
        }

        // Apply environmental weights
        $weighted = $this->applyEnvironmentalWeights($available, $weather, $timeOfDay, $season, $difficultyLevel);

        return $this->selectFromWeightedPool($weighted);
    }

    /**
     * Check if a backstory should unlock.
     */
    public function checkBackstoryUnlock(array $passenger, bool $isFirstEncounter): bool
    {
        $chance = $isFirstEncounter
            ? Constants::BACKSTORY_UNLOCK_FIRST
            : Constants::BACKSTORY_UNLOCK_REPEAT;

        // Legendary passengers always unlock on first encounter
        if ($isFirstEncounter && ($passenger['rarity'] ?? 'common') === 'legendary') {
            return true;
        }

        return (random_int(0, 100) / 100) < $chance;
    }

    /**
     * Calculate backstory unlock chance for UI display.
     *
     * @param array<int, bool> $passengerBackstories
     */
    public function calculateBackstoryChance(int $passengerId, array $passengerBackstories = []): float
    {
        if (isset($passengerBackstories[$passengerId]) && $passengerBackstories[$passengerId]) {
            return 0.0;
        }

        $isFirst = !isset($passengerBackstories[$passengerId]);
        return $isFirst ? Constants::BACKSTORY_UNLOCK_FIRST : Constants::BACKSTORY_UNLOCK_REPEAT;
    }

    // ─── Private Helpers ──────────────────────────────────────────────

    private function selectByRarity(array $passengers, int $difficultyLevel = 0): ?array
    {
        if (empty($passengers)) {
            return null;
        }

        $weights = $this->getAdjustedRarityWeights($difficultyLevel);
        $weighted = [];

        foreach ($passengers as $passenger) {
            $rarity = $passenger['rarity'] ?? 'common';
            $weight = $weights[$rarity] ?? 1;
            $weighted[] = ['passenger' => $passenger, 'weight' => $weight];
        }

        return $this->selectFromWeightedPool($weighted);
    }

    private function getAdjustedRarityWeights(int $difficultyLevel): array
    {
        $base = Constants::RARITY_WEIGHTS;
        $diffMod = min(1.0, $difficultyLevel * 0.15);

        return [
            'common' => max(10, $base['common'] - (int) ($diffMod * 20)),
            'uncommon' => $base['uncommon'] ?? 25,
            'rare' => $base['rare'] + (int) ($diffMod * 10),
            'legendary' => $base['legendary'] + (int) ($diffMod * 5),
        ];
    }

    private function applyEnvironmentalWeights(
        array $passengers,
        array $weather,
        array $timeOfDay,
        array $season,
        int $difficultyLevel
    ): array {
        $weighted = [];

        foreach ($passengers as $passenger) {
            $rarity = $passenger['rarity'] ?? 'common';
            $baseWeight = $this->getBaseRarityWeight($rarity, $difficultyLevel);

            // Apply environmental modifiers
            $weatherMod = $this->getWeatherModifier($passenger, $weather);
            $timeMod = $this->getTimeModifier($passenger, $timeOfDay);
            $seasonMod = $this->getSeasonalModifier($passenger, $season);

            $finalWeight = max(1, (int) ($baseWeight * $weatherMod * $timeMod * $seasonMod));
            $weighted[] = ['passenger' => $passenger, 'weight' => $finalWeight];
        }

        return $weighted;
    }

    private function getBaseRarityWeight(string $rarity, int $difficultyLevel): int
    {
        $weights = $this->getAdjustedRarityWeights($difficultyLevel);
        return $weights[$rarity] ?? 1;
    }

    private function getWeatherModifier(array $passenger, array $weather): float
    {
        $weatherType = $weather['type'] ?? 'clear';
        $supernatural = $passenger['supernatural'] ?? '';

        // Supernatural passengers more likely in bad weather
        if ($supernatural !== '' && $weatherType !== 'clear') {
            return 1.5;
        }

        return 1.0;
    }

    private function getTimeModifier(array $passenger, array $timeOfDay): float
    {
        $phase = $timeOfDay['phase'] ?? 'night';
        $rarity = $passenger['rarity'] ?? 'common';

        // Rare/legendary passengers more likely at late night
        if ($phase === 'latenight' && in_array($rarity, ['rare', 'legendary'], true)) {
            return 2.0;
        }

        return 1.0;
    }

    private function getSeasonalModifier(array $passenger, array $season): float
    {
        // Default: no seasonal modification
        return 1.0;
    }

    private function selectFromWeightedPool(array $weighted): ?array
    {
        if (empty($weighted)) {
            return null;
        }

        $totalWeight = array_sum(array_column($weighted, 'weight'));
        if ($totalWeight <= 0) {
            return $weighted[0]['passenger'] ?? null;
        }

        $roll = random_int(1, $totalWeight);
        $cumulative = 0;

        foreach ($weighted as $entry) {
            $cumulative += $entry['weight'];
            if ($roll <= $cumulative) {
                return $entry['passenger'];
            }
        }

        return $weighted[count($weighted) - 1]['passenger'] ?? null;
    }
}
