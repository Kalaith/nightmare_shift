<?php
declare(strict_types=1);

namespace App\Services;

/**
 * Strips internal state from game data before sending to the client.
 *
 * Uses a WHITELIST approach — only fields the frontend needs to
 * render the UI are included. Everything else stays server-side
 * in game_saves for game logic.
 */
final class PassengerSanitizer
{
    // ── Passenger ───────────────────────────────────────────────────

    private const PASSENGER_FIELDS = [
        'id', 'name', 'emoji', 'description',
        'pickup', 'destination', 'fare', 'rarity',
        'backstoryUnlocked', 'dialogue',
    ];

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
        
        // Return empty collections for frontend type safety while hiding data
        $sanitized['items'] = [];
        $sanitized['relationships'] = [];

        return $sanitized;
    }

    // ── Rules ───────────────────────────────────────────────────────

    private const RULE_FIELDS = ['id', 'title', 'description', 'difficulty', 'type', 'visible'];

    public static function sanitizeRules(?array $rules): ?array
    {
        if ($rules === null) {
            return null;
        }

        return array_values(array_map(function (?array $rule): ?array {
            if ($rule === null) return null;
            $out = [];
            foreach (self::RULE_FIELDS as $f) {
                if (array_key_exists($f, $rule)) $out[$f] = $rule[$f];
            }
            return $out;
        }, $rules));
    }

    // ── Weather (display only) ──────────────────────────────────────

    private static function sanitizeWeather(?array $weather): ?array
    {
        if ($weather === null) {
            return null;
        }

        return [
            'type'        => $weather['type'] ?? null,
            'intensity'   => $weather['intensity'] ?? null,
            'description' => $weather['description'] ?? null,
            'icon'        => $weather['icon'] ?? null,
        ];
    }

    // ── Full game state ─────────────────────────────────────────────

    /**
     * Whitelist only the fields the frontend needs to render the UI.
     * Everything else is internal server state.
     */
    public static function sanitizeGameState(array $gs): array
    {
        return [
            // Core display
            'currentScreen'     => $gs['currentScreen'] ?? null,
            'gamePhase'         => $gs['gamePhase'] ?? null,
            'fuel'              => $gs['fuel'] ?? 0,
            'earnings'          => $gs['earnings'] ?? 0,
            'timeRemaining'     => $gs['timeRemaining'] ?? 0,
            'ridesCompleted'    => $gs['ridesCompleted'] ?? 0,
            'rulesViolated'     => $gs['rulesViolated'] ?? 0,
            'inventory'         => $gs['inventory'] ?? [],

            // Sanitized game content
            'currentPassenger'  => self::sanitizePassenger($gs['currentPassenger'] ?? null),
            'currentRules'      => self::sanitizeRules($gs['currentRules'] ?? null),
            'currentGuidelines' => self::sanitizeRules($gs['currentGuidelines'] ?? null),
            'currentRide'       => $gs['currentRide'] ?? null,

            // Weather — display fields only
            'currentWeather'    => self::sanitizeWeather($gs['currentWeather'] ?? null),

            // Time of day — display fields only
            'timeOfDay'         => isset($gs['timeOfDay']) ? [
                'phase'       => $gs['timeOfDay']['phase'] ?? null,
                'hour'        => $gs['timeOfDay']['hour'] ?? null,
                'description' => $gs['timeOfDay']['description'] ?? null,
            ] : null,

            // Season — display only, strip passengerModifiers
            'season'            => isset($gs['season']) ? [
                'type'        => $gs['season']['type'] ?? null,
                'description' => $gs['season']['description'] ?? null,
            ] : null,

            // Difficulty level (shown in UI)
            'difficultyLevel'   => $gs['difficultyLevel'] ?? 0,

            // Empty collections to prevent frontend .length / .map crashes
            // while still hiding the data from the client as requested
            'environmentalHazards' => [],
            'weatherEffects'       => [],
            'routeHistory'         => [],
            'completedRides'       => [],
            'detectedTells'        => [],
            'routeConsequences'    => [],
            'passengerReputation'  => (object)[],
            'passengerBackstories' => (object)[],
            
            // Ride summary data
            'lastRideCompletion'   => isset($gs['lastRideCompletion']) ? [
                'passenger' => self::sanitizePassenger($gs['lastRideCompletion']['passenger'] ?? null),
                'fareEarned' => $gs['lastRideCompletion']['fareEarned'] ?? 0,
                'itemsReceived' => $gs['lastRideCompletion']['itemsReceived'] ?? [],
                'backstoryUnlocked' => $gs['lastRideCompletion']['backstoryUnlocked'] ?? null,
            ] : null,
        ];
    }
}
