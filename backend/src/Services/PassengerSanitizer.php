<?php
declare(strict_types=1);

namespace App\Services;

/**
 * Strips internal state from game data before sending to the client.
 */
final class PassengerSanitizer
{
    private const PASSENGER_FIELDS = [
        'id', 'name', 'emoji', 'description',
        'pickup', 'destination', 'fare', 'rarity',
        'backstoryUnlocked', 'dialogue',
    ];

    private const RULE_FIELDS = ['id', 'title', 'description', 'difficulty', 'type', 'visible'];

    public static function sanitizePassenger(?array $passenger): ?array
    {
        if ($passenger === null) {
            return null;
        }

        $sanitized = [];
        foreach (self::PASSENGER_FIELDS as $field) {
            if (array_key_exists($field, $passenger)) {
                $sanitized[$field] = $passenger[$field];
            }
        }

        $sanitized['backstoryUnlocked'] = $passenger['backstoryUnlocked'] ?? false;
        $sanitized['items'] = [];
        $sanitized['relationships'] = [];

        return $sanitized;
    }

    public static function sanitizeRules(?array $rules): ?array
    {
        if ($rules === null) {
            return null;
        }

        return array_values(array_map(function (?array $rule): ?array {
            if ($rule === null) {
                return null;
            }

            $out = [];
            foreach (self::RULE_FIELDS as $field) {
                if (array_key_exists($field, $rule)) {
                    $out[$field] = $rule[$field];
                }
            }
            return $out;
        }, $rules));
    }

    private static function sanitizeWeather(?array $weather): ?array
    {
        if ($weather === null) {
            return null;
        }

        return [
            'type' => $weather['type'] ?? null,
            'intensity' => $weather['intensity'] ?? null,
            'description' => $weather['description'] ?? null,
            'icon' => $weather['icon'] ?? null,
        ];
    }

    public static function sanitizeGameState(array $gs): array
    {
        return [
            'currentScreen' => $gs['currentScreen'] ?? null,
            'gamePhase' => $gs['gamePhase'] ?? null,
            'fuel' => $gs['fuel'] ?? 0,
            'earnings' => $gs['earnings'] ?? 0,
            'minimumEarnings' => $gs['minimumEarnings'] ?? 30,
            'timeRemaining' => $gs['timeRemaining'] ?? 0,
            'ridesCompleted' => $gs['ridesCompleted'] ?? 0,
            'rulesViolated' => $gs['rulesViolated'] ?? 0,
            'inventory' => $gs['inventory'] ?? [],
            'currentPassenger' => self::sanitizePassenger($gs['currentPassenger'] ?? null),
            'currentRules' => self::sanitizeRules($gs['currentRules'] ?? null),
            'currentGuidelines' => self::sanitizeRules($gs['currentGuidelines'] ?? null),
            'currentRide' => $gs['currentRide'] ?? null,
            'currentDialogue' => $gs['currentDialogue'] ?? null,
            'currentDrivingPhase' => $gs['currentDrivingPhase'] ?? null,
            'interactionResult' => $gs['interactionResult'] ?? null,
            'routeChoiceResult' => $gs['routeChoiceResult'] ?? null,
            'cabState' => $gs['cabState'] ?? ['windowsOpen' => false, 'radioOn' => false],
            'rideProgress' => $gs['rideProgress'] ?? null,
            'pendingTipOffer' => $gs['pendingTipOffer'] ?? null,
            'currentWeather' => self::sanitizeWeather($gs['currentWeather'] ?? null),
            'timeOfDay' => isset($gs['timeOfDay']) ? [
                'phase' => $gs['timeOfDay']['phase'] ?? null,
                'hour' => $gs['timeOfDay']['hour'] ?? null,
                'description' => $gs['timeOfDay']['description'] ?? null,
            ] : null,
            'season' => isset($gs['season']) ? [
                'type' => $gs['season']['type'] ?? null,
                'description' => $gs['season']['description'] ?? null,
            ] : null,
            'difficultyLevel' => $gs['difficultyLevel'] ?? 0,
            'environmentalHazards' => [],
            'weatherEffects' => [],
            'routeHistory' => [],
            'completedRides' => [],
            'detectedTells' => [],
            'routeConsequences' => [],
            'passengerReputation' => (object) [],
            'passengerBackstories' => (object) [],
            'lastRideCompletion' => isset($gs['lastRideCompletion']) ? [
                'passenger' => self::sanitizePassenger($gs['lastRideCompletion']['passenger'] ?? null),
                'fareEarned' => $gs['lastRideCompletion']['fareEarned'] ?? 0,
                'itemsReceived' => $gs['lastRideCompletion']['itemsReceived'] ?? [],
                'backstoryUnlocked' => $gs['lastRideCompletion']['backstoryUnlocked'] ?? null,
            ] : null,
        ];
    }
}
