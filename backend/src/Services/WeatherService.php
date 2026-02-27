<?php
declare(strict_types=1);

namespace App\Services;

/**
 * Weather service — port of frontend weatherService.ts
 * Handles weather generation, time-of-day, seasons, hazards, and weather effects.
 */
final class WeatherService
{
    /**
     * Generate initial weather conditions for a shift.
     *
     * @return array<string, mixed>
     */
    public function generateInitialWeather(array $season): array
    {
        $seasonalTypes = $this->getSeasonalWeatherTypes($season);
        $type = $seasonalTypes[array_rand($seasonalTypes)];
        return $this->createWeatherCondition($type, $season);
    }

    /**
     * Get the current season based on actual date.
     *
     * @return array<string, mixed>
     */
    public function getCurrentSeason(): array
    {
        $month = (int) date('n');

        if ($month >= 3 && $month <= 5) {
            $type = 'spring';
            $temperature = 'mild';
        } elseif ($month >= 6 && $month <= 8) {
            $type = 'summer';
            $temperature = 'hot';
        } elseif ($month >= 9 && $month <= 11) {
            $type = 'fall';
            $temperature = 'cool';
        } else {
            $type = 'winter';
            $temperature = 'cold';
        }

        return [
            'type' => $type,
            'month' => $month,
            'temperature' => $temperature,
            'description' => $this->getSeasonDescription($type, $temperature),
            'passengerModifiers' => $this->getSeasonalPassengerModifiers($type),
        ];
    }

    /**
     * Update time of day based on elapsed shift time.
     *
     * @return array<string, mixed>
     */
    public function updateTimeOfDay(int $shiftStartTime, int $currentTime): array
    {
        $elapsedMinutes = ($currentTime - $shiftStartTime) / 60;
        // Shifts start at 10 PM (22:00) and time progresses
        $hour = (int) (22 + ($elapsedMinutes / 60)) % 24;

        return $this->getTimeOfDayFromHour($hour);
    }

    /**
     * Generate environmental hazards based on conditions.
     *
     * @return array<int, array<string, mixed>>
     */
    public function generateEnvironmentalHazards(array $weather, array $timeOfDay, array $season): array
    {
        $chance = $this->calculateHazardChance($weather, $timeOfDay, $season);

        if ((random_int(0, 100) / 100) > $chance) {
            return [];
        }

        $hazardType = $this->selectHazardType($weather, $timeOfDay);
        $severity = random_int(0, 2) === 0 ? 'extreme' : (random_int(0, 1) === 0 ? 'major' : 'minor');
        $locations = ['Downtown', 'Warehouse District', 'Cemetery Road', 'Industrial Zone', 'The Docks'];
        $location = $locations[array_rand($locations)];

        return [$this->createEnvironmentalHazard($hazardType, $severity, $location, $weather)];
    }

    /**
     * Apply weather effects to route costs.
     *
     * @return array{fuel: float, time: float, risk: float}
     */
    public function applyWeatherEffects(
        float $baseFuel,
        float $baseTime,
        float $baseRisk,
        array $weather,
        array $timeOfDay
    ): array {
        $fuelMod = 1.0;
        $timeMod = 1.0;
        $riskMod = 1.0;

        $intensity = $weather['intensity'] ?? 'light';
        $intensityMod = match ($intensity) {
            'heavy' => 1.5,
            'moderate' => 1.2,
            default => 1.0,
        };

        $weatherType = $weather['type'] ?? 'clear';
        if ($weatherType !== 'clear') {
            $fuelMod *= 1.0 + (0.1 * $intensityMod);
            $timeMod *= 1.0 + (0.15 * $intensityMod);
            $riskMod *= 1.0 + (0.2 * $intensityMod);
        }

        // Night time increases risk
        $phase = $timeOfDay['phase'] ?? 'night';
        if (in_array($phase, ['night', 'latenight'], true)) {
            $riskMod *= 1.3;
            $supernaturalActivity = (float) ($timeOfDay['supernaturalActivity'] ?? 50) / 100;
            $riskMod *= (1.0 + $supernaturalActivity * 0.2);
        }

        return [
            'fuel' => round($baseFuel * $fuelMod, 1),
            'time' => round($baseTime * $timeMod, 1),
            'risk' => min(1.0, round($baseRisk * $riskMod, 2)),
        ];
    }

    /**
     * Update weather conditions over time.
     *
     * @return array<string, mixed>
     */
    public function updateWeather(array $currentWeather, int $gameTime, array $season): array
    {
        $duration = (int) ($currentWeather['duration'] ?? 30);
        $startTime = (int) ($currentWeather['startTime'] ?? 0);

        if (($gameTime - $startTime) >= ($duration * 60)) {
            // Weather expired, generate new
            $seasonalTypes = $this->getSeasonalWeatherTypes($season);
            $newType = $seasonalTypes[array_rand($seasonalTypes)];
            return $this->createWeatherCondition($newType, $season);
        }

        return $currentWeather;
    }

    // ─── Private Helpers ──────────────────────────────────────────────

    private function getSeasonalWeatherTypes(array $season): array
    {
        $type = $season['type'] ?? 'fall';
        return match ($type) {
            'spring' => ['clear', 'rain', 'fog', 'wind'],
            'summer' => ['clear', 'thunderstorm', 'wind'],
            'fall' => ['clear', 'rain', 'fog', 'wind'],
            'winter' => ['clear', 'snow', 'fog', 'wind'],
            default => ['clear', 'rain', 'fog'],
        };
    }

    private function createWeatherCondition(string $type, array $season): array
    {
        $intensity = $this->getRandomIntensity($type);
        return [
            'type' => $type,
            'intensity' => $intensity,
            'visibility' => $this->calculateVisibility($type, $intensity),
            'description' => $this->getWeatherDescription($type, $intensity),
            'icon' => $this->getWeatherIcon($type, $intensity),
            'effects' => $this->getWeatherEffects($type, $intensity),
            'duration' => $this->getWeatherDuration($type, $intensity, $season),
            'startTime' => time(),
        ];
    }

    private function getRandomIntensity(string $type): string
    {
        if ($type === 'clear') {
            return 'light';
        }
        $roll = random_int(1, 10);
        if ($roll <= 4) return 'light';
        if ($roll <= 7) return 'moderate';
        return 'heavy';
    }

    private function calculateVisibility(string $type, string $intensity): int
    {
        $base = match ($type) {
            'clear' => 100,
            'rain' => 70,
            'fog' => 40,
            'snow' => 60,
            'thunderstorm' => 50,
            'wind' => 85,
            default => 80,
        };
        $mod = match ($intensity) {
            'heavy' => 0.6,
            'moderate' => 0.8,
            default => 1.0,
        };
        return max(10, (int) ($base * $mod));
    }

    private function getWeatherDescription(string $type, string $intensity): string
    {
        return ucfirst($intensity) . ' ' . $type;
    }

    private function getWeatherIcon(string $type, string $intensity): string
    {
        return match ($type) {
            'clear' => '☀️',
            'rain' => '🌧️',
            'fog' => '🌫️',
            'snow' => '❄️',
            'thunderstorm' => '⛈️',
            'wind' => '💨',
            default => '🌙',
        };
    }

    private function getWeatherEffects(string $type, string $intensity): array
    {
        $effects = [];
        $intensityMod = match ($intensity) {
            'heavy' => 1.5,
            'moderate' => 1.2,
            default => 1.0,
        };

        if ($type !== 'clear') {
            $effects[] = [
                'type' => 'visibility_reduction',
                'value' => round(0.2 * $intensityMod, 2),
                'description' => 'Reduced visibility',
            ];
            $effects[] = [
                'type' => 'fuel_consumption',
                'value' => round(0.1 * $intensityMod, 2),
                'description' => 'Increased fuel consumption',
            ];
        }

        if (in_array($type, ['thunderstorm', 'fog'], true)) {
            $effects[] = [
                'type' => 'supernatural_attraction',
                'value' => round(0.3 * $intensityMod, 2),
                'description' => 'Increased supernatural activity',
            ];
        }

        return $effects;
    }

    private function getWeatherDuration(string $type, string $intensity, array $season): int
    {
        $base = match ($type) {
            'clear' => 30,
            'rain' => 20,
            'fog' => 15,
            'snow' => 25,
            'thunderstorm' => 10,
            'wind' => 20,
            default => 20,
        };
        $mod = match ($intensity) {
            'heavy' => 0.7,
            'moderate' => 1.0,
            default => 1.3,
        };
        return max(5, (int) ($base * $mod));
    }

    private function getTimeOfDayFromHour(int $hour): array
    {
        if ($hour >= 5 && $hour < 7) {
            $phase = 'dawn';
            $light = 30;
            $supernatural = 20;
        } elseif ($hour >= 7 && $hour < 12) {
            $phase = 'morning';
            $light = 80;
            $supernatural = 5;
        } elseif ($hour >= 12 && $hour < 17) {
            $phase = 'afternoon';
            $light = 100;
            $supernatural = 0;
        } elseif ($hour >= 17 && $hour < 20) {
            $phase = 'dusk';
            $light = 40;
            $supernatural = 30;
        } elseif ($hour >= 20 || $hour < 1) {
            $phase = 'night';
            $light = 15;
            $supernatural = 70;
        } else {
            $phase = 'latenight';
            $light = 5;
            $supernatural = 100;
        }

        return [
            'phase' => $phase,
            'hour' => $hour,
            'description' => ucfirst($phase),
            'ambientLight' => $light,
            'supernaturalActivity' => $supernatural,
        ];
    }

    private function getSeasonDescription(string $type, string $temperature): string
    {
        return ucfirst($type) . ' — ' . $temperature . ' temperatures';
    }

    private function getSeasonalPassengerModifiers(string $type): array
    {
        return [
            'spawnRates' => [],
            'behaviorChanges' => [],
        ];
    }

    private function calculateHazardChance(array $weather, array $timeOfDay, array $season): float
    {
        $base = 0.15;
        $weatherType = $weather['type'] ?? 'clear';
        if ($weatherType !== 'clear') {
            $base += 0.15;
        }
        $phase = $timeOfDay['phase'] ?? 'night';
        if (in_array($phase, ['night', 'latenight'], true)) {
            $base += 0.1;
        }
        return min(0.7, $base);
    }

    private function selectHazardType(array $weather, array $timeOfDay): string
    {
        $types = ['construction', 'accident', 'supernatural_event', 'road_closure', 'police_checkpoint'];
        $phase = $timeOfDay['phase'] ?? 'night';
        if (in_array($phase, ['night', 'latenight'], true)) {
            $types[] = 'supernatural_event';
            $types[] = 'supernatural_event'; // Double chance at night
        }
        return $types[array_rand($types)];
    }

    private function createEnvironmentalHazard(string $type, string $severity, string $location, array $weather): array
    {
        return [
            'id' => uniqid('hazard_'),
            'type' => $type,
            'location' => $location,
            'severity' => $severity,
            'description' => ucfirst(str_replace('_', ' ', $type)) . ' at ' . $location,
            'effects' => $this->getHazardEffects($type, $severity),
            'duration' => random_int(5, 20),
            'startTime' => time(),
            'weatherTriggered' => ($weather['type'] ?? 'clear') !== 'clear',
        ];
    }

    private function getHazardEffects(string $type, string $severity): array
    {
        $severityMod = match ($severity) {
            'extreme' => 2.0,
            'major' => 1.5,
            default => 1.0,
        };

        return [
            'timeDelay' => (int) (5 * $severityMod),
            'fuelIncrease' => round(0.1 * $severityMod, 2),
            'riskIncrease' => round(0.15 * $severityMod, 2),
        ];
    }
}
