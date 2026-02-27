<?php
declare(strict_types=1);

namespace App\Services;

use App\Data\Constants;

/**
 * Route service — port of frontend RouteService class from reputationService.ts
 * Handles route cost calculation, options, and availability.
 */
final class RouteService
{
    /**
     * Calculate route costs considering passenger risk, weather, and mastery.
     *
     * @return array{fuelCost: float, timeCost: float, riskLevel: float}
     */
    public function calculateRouteCosts(
        string $routeType,
        float $passengerRiskLevel = 1.0,
        array $weather = [],
        array $timeOfDay = [],
        array $hazards = [],
        array $routeMastery = [],
        array $passenger = []
    ): array {
        $baseFuel = (float) Constants::getFuelCost($routeType);
        $baseTime = (float) Constants::getTimeCost($routeType);
        $baseRisk = Constants::getRiskLevel($routeType);

        // Apply passenger risk modifier
        $baseRisk *= $passengerRiskLevel;

        // Apply route mastery discount (up to 15% reduction)
        $mastery = (int) ($routeMastery[$routeType] ?? 0);
        if ($mastery > 0) {
            $discount = min(0.15, $mastery * 0.02);
            $baseFuel *= (1 - $discount);
            $baseTime *= (1 - $discount);
        }

        // Apply weather effects if present
        if (!empty($weather) && !empty($timeOfDay)) {
            $weatherService = new WeatherService();
            $modified = $weatherService->applyWeatherEffects($baseFuel, $baseTime, $baseRisk, $weather, $timeOfDay);
            return [
                'fuelCost' => $modified['fuel'],
                'timeCost' => $modified['time'],
                'riskLevel' => $modified['risk'],
            ];
        }

        return [
            'fuelCost' => round($baseFuel, 1),
            'timeCost' => round($baseTime, 1),
            'riskLevel' => min(1.0, round($baseRisk, 2)),
        ];
    }

    /**
     * Get all available route options with costs and availability.
     *
     * @return array<string, array<string, mixed>>
     */
    public function getRouteOptions(
        float $currentFuel,
        float $currentTime,
        float $passengerRiskLevel = 1.0,
        array $weather = [],
        array $timeOfDay = [],
        array $hazards = [],
        array $routeMastery = [],
        ?array $passenger = null
    ): array {
        $routeTypes = [
            Constants::ROUTE_NORMAL => ['name' => 'Normal Route', 'description' => 'Standard route — balanced cost and risk'],
            Constants::ROUTE_SHORTCUT => ['name' => 'Shortcut', 'description' => 'Faster but riskier through dark alleys'],
            Constants::ROUTE_SCENIC => ['name' => 'Scenic Route', 'description' => 'Longer but safer through well-lit streets'],
            Constants::ROUTE_POLICE => ['name' => 'Police Route', 'description' => 'Near police stations — moderate cost and risk'],
        ];

        $options = [];

        foreach ($routeTypes as $type => $info) {
            $costs = $this->calculateRouteCosts($type, $passengerRiskLevel, $weather, $timeOfDay, $hazards, $routeMastery, $passenger ?? []);

            $available = $currentFuel >= $costs['fuelCost'] && $currentTime >= $costs['timeCost'];

            $option = array_merge($info, [
                'type' => $type,
                'fuelCost' => $costs['fuelCost'],
                'timeCost' => $costs['timeCost'],
                'riskLevel' => $costs['riskLevel'],
                'available' => $available,
            ]);

            // Add passenger reaction if applicable
            if ($passenger !== null && isset($passenger['routePreferences'])) {
                foreach ($passenger['routePreferences'] as $pref) {
                    if (($pref['route'] ?? '') === $type) {
                        $option['passengerReaction'] = $this->getReactionFromPreference($pref['preference'] ?? 'neutral');
                        $option['fareModifier'] = (float) ($pref['fareModifier'] ?? 1.0);
                        break;
                    }
                }
            }

            $options[$type] = $option;
        }

        return $options;
    }

    private function getReactionFromPreference(string $preference): string
    {
        return match ($preference) {
            'loves', 'likes' => 'positive',
            'dislikes', 'fears' => 'negative',
            default => 'neutral',
        };
    }
}
