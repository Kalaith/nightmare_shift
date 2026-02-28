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
        ?array $passenger = null,
        array $playerStats = []
    ): array {
        $routeTypes = [
            Constants::ROUTE_NORMAL => ['name' => 'Normal Route', 'description' => 'Standard route — balanced cost and risk'],
            Constants::ROUTE_SHORTCUT => ['name' => 'Shortcut', 'description' => 'Faster but riskier through dark alleys'],
            Constants::ROUTE_SCENIC => ['name' => 'Scenic Route', 'description' => 'Longer but safer through well-lit streets'],
            Constants::ROUTE_POLICE => ['name' => 'Police Route', 'description' => 'Near police stations — moderate cost and risk'],
        ];

        $almanacLevel = (int) ($playerStats['almanacLevel'] ?? 1);

        $options = [];

        foreach ($routeTypes as $type => $info) {
            $costs = $this->calculateRouteCosts($type, $passengerRiskLevel, $weather, $timeOfDay, $hazards, $routeMastery, $passenger ?? []);

            $available = $currentFuel >= $costs['fuelCost'] && $currentTime >= $costs['timeCost'];

            $option = array_merge($info, [
                'type' => $type,
                'fuelCost' => $costs['fuelCost'],
                'timeCost' => $costs['timeCost'],
                'available' => $available,
            ]);

            // Add passenger reaction if applicable
            $reaction = 'neutral';
            $fareModifier = 1.0;
            if ($passenger !== null && isset($passenger['routePreferences'])) {
                foreach ($passenger['routePreferences'] as $pref) {
                    if (($pref['route'] ?? '') === $type) {
                        $reaction = $this->getReactionFromPreference($pref['preference'] ?? 'neutral');
                        $fareModifier = (float) ($pref['fareModifier'] ?? 1.0);
                        break;
                    }
                }
            }

            // --- Server-Side UI Rendering based on Almanac Knowledge --- //
            
            // 1. Color Class
            $colorClass = 'bg-gradient-to-br from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white border border-slate-500/50 hover:border-slate-400/70';
            
            if (!$available) {
                 $colorClass = 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50 border border-slate-700';
            } elseif ($costs['riskLevel'] >= 4) {
                 $colorClass = match($type) {
                     'normal' => 'bg-gradient-to-br from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white border-2 border-amber-500 shadow-amber-500/20',
                     'shortcut' => 'bg-gradient-to-br from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-white border-2 border-amber-500 shadow-amber-500/20',
                     'scenic' => 'bg-gradient-to-br from-emerald-800 to-slate-800 hover:from-emerald-700 hover:to-slate-700 text-white border-2 border-amber-500 shadow-amber-500/20',
                     default => 'bg-gradient-to-br from-indigo-800 to-slate-800 hover:from-indigo-700 hover:to-slate-700 text-white border-2 border-amber-500 shadow-amber-500/20'
                 };
            } elseif ($costs['riskLevel'] >= 3) {
                 $colorClass = match($type) {
                     'normal' => 'bg-gradient-to-br from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white border border-yellow-400/60 shadow-yellow-400/10',
                     'shortcut' => 'bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white border border-yellow-400/60 shadow-yellow-400/10',
                     'scenic' => 'bg-gradient-to-br from-emerald-700 to-slate-700 hover:from-emerald-600 hover:to-slate-600 text-white border border-yellow-400/60 shadow-yellow-400/10',
                     default => 'bg-gradient-to-br from-indigo-700 to-slate-700 hover:from-indigo-600 hover:to-slate-600 text-white border border-yellow-400/60 shadow-yellow-400/10'
                 };
            } elseif ($reaction === 'positive') {
                 $colorClass = match($type) {
                     'normal' => 'bg-gradient-to-br from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white border-2 border-emerald-400/80 shadow-emerald-400/20',
                     'shortcut' => 'bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white border-2 border-emerald-400/80 shadow-emerald-400/20',
                     'scenic' => 'bg-gradient-to-br from-emerald-700 to-emerald-800 hover:from-emerald-600 hover:to-emerald-700 text-white border-2 border-emerald-400/80 shadow-emerald-400/20',
                     default => 'bg-gradient-to-br from-indigo-700 to-indigo-800 hover:from-indigo-600 hover:to-indigo-700 text-white border-2 border-emerald-400/80 shadow-emerald-400/20'
                 };
            } elseif ($reaction === 'negative') {
                 $colorClass = match($type) {
                     'normal' => 'bg-gradient-to-br from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white border-2 border-rose-400/60 shadow-rose-400/10',
                     'shortcut' => 'bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white border-2 border-rose-400/60 shadow-rose-400/10',
                     'scenic' => 'bg-gradient-to-br from-emerald-700 to-slate-700 hover:from-emerald-600 hover:to-slate-600 text-white border-2 border-rose-400/60 shadow-rose-400/10',
                     default => 'bg-gradient-to-br from-indigo-700 to-slate-700 hover:from-indigo-600 hover:to-slate-600 text-white border-2 border-rose-400/60 shadow-rose-400/10'
                 };
            } else {
                 $colorClass = match($type) {
                     'shortcut' => 'bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white border border-gray-500/50 hover:border-gray-400/70',
                     'scenic' => 'bg-gradient-to-br from-emerald-700 to-emerald-800 hover:from-emerald-600 hover:to-emerald-700 text-white border border-emerald-500/50 hover:border-emerald-400/70',
                     'police' => 'bg-gradient-to-br from-indigo-700 to-indigo-800 hover:from-indigo-600 hover:to-indigo-700 text-white border border-indigo-500/50 hover:border-indigo-400/70',
                     default => $colorClass
                 };
            }
            $option['colorClass'] = $colorClass;

            // 2. Risk Display (Requires Almanac Level 2)
            if ($passenger !== null && $almanacLevel >= 2) {
                $option['riskDisplay'] = [
                    'visible' => true,
                    'level' => $costs['riskLevel'],
                    'color' => $costs['riskLevel'] >= 4 ? 'amber' : ($costs['riskLevel'] >= 3 ? 'yellow' : 'gray')
                ];
            } else {
                $option['riskDisplay'] = [
                    'visible' => false
                ];
            }

            // 3. Fare Bonus Display (Requires Almanac Level 2)
            if ($passenger !== null && $almanacLevel >= 2 && $fareModifier !== 1.0) {
                $option['fareBonusDisplay'] = [
                    'visible' => true,
                    'percentage' => round(($fareModifier - 1) * 100),
                    'color' => $fareModifier > 1.0 ? 'emerald' : 'rose'
                ];
            } else {
                $option['fareBonusDisplay'] = [
                    'visible' => false
                ];
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
