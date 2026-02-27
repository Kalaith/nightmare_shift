<?php
declare(strict_types=1);

namespace App\Data;

/**
 * Game constants — direct port of frontend constants.ts + gameBalance.ts
 */
final class Constants
{
    // Initial values
    public const INITIAL_FUEL = 100;
    public const INITIAL_TIME = 600; // 10 minutes in seconds
    public const SURVIVAL_BONUS = 50;
    public const MINIMUM_EARNINGS = 30;

    // Backstory unlock chances
    public const BACKSTORY_UNLOCK_FIRST = 0.15;
    public const BACKSTORY_UNLOCK_REPEAT = 0.35;

    // Route fuel costs
    public const FUEL_COST_NORMAL = 15;
    public const FUEL_COST_SHORTCUT = 25;
    public const FUEL_COST_SCENIC = 10;
    public const FUEL_COST_POLICE = 20;

    // Route time costs (seconds)
    public const TIME_COST_NORMAL = 45;
    public const TIME_COST_SHORTCUT = 30;
    public const TIME_COST_SCENIC = 60;
    public const TIME_COST_POLICE = 50;

    // Route risk levels (0-1)
    public const RISK_NORMAL = 0.1;
    public const RISK_SHORTCUT = 0.4;
    public const RISK_SCENIC = 0.2;
    public const RISK_POLICE = 0.3;

    // Rarity weights
    public const RARITY_WEIGHTS = [
        'common' => 60,
        'uncommon' => 25,
        'rare' => 12,
        'legendary' => 3,
    ];

    // Screens
    public const SCREEN_LOADING = 'loading';
    public const SCREEN_LEADERBOARD = 'leaderboard';
    public const SCREEN_BRIEFING = 'briefing';
    public const SCREEN_GAME = 'game';
    public const SCREEN_GAME_OVER = 'gameover';
    public const SCREEN_SUCCESS = 'success';

    // Game phases
    public const PHASE_WAITING = 'waiting';
    public const PHASE_RIDE_REQUEST = 'rideRequest';
    public const PHASE_DRIVING = 'driving';
    public const PHASE_INTERACTION = 'interaction';
    public const PHASE_DROP_OFF = 'dropOff';
    public const PHASE_GAME_OVER = 'gameOver';
    public const PHASE_SUCCESS = 'success';

    // Route types
    public const ROUTE_NORMAL = 'normal';
    public const ROUTE_SHORTCUT = 'shortcut';
    public const ROUTE_SCENIC = 'scenic';
    public const ROUTE_POLICE = 'police';

    /**
     * Get fuel cost for a route type.
     */
    public static function getFuelCost(string $routeType): int
    {
        return match ($routeType) {
            self::ROUTE_NORMAL => self::FUEL_COST_NORMAL,
            self::ROUTE_SHORTCUT => self::FUEL_COST_SHORTCUT,
            self::ROUTE_SCENIC => self::FUEL_COST_SCENIC,
            self::ROUTE_POLICE => self::FUEL_COST_POLICE,
            default => self::FUEL_COST_NORMAL,
        };
    }

    /**
     * Get time cost for a route type.
     */
    public static function getTimeCost(string $routeType): int
    {
        return match ($routeType) {
            self::ROUTE_NORMAL => self::TIME_COST_NORMAL,
            self::ROUTE_SHORTCUT => self::TIME_COST_SHORTCUT,
            self::ROUTE_SCENIC => self::TIME_COST_SCENIC,
            self::ROUTE_POLICE => self::TIME_COST_POLICE,
            default => self::TIME_COST_NORMAL,
        };
    }

    /**
     * Get risk level for a route type.
     */
    public static function getRiskLevel(string $routeType): float
    {
        return match ($routeType) {
            self::ROUTE_NORMAL => self::RISK_NORMAL,
            self::ROUTE_SHORTCUT => self::RISK_SHORTCUT,
            self::ROUTE_SCENIC => self::RISK_SCENIC,
            self::ROUTE_POLICE => self::RISK_POLICE,
            default => self::RISK_NORMAL,
        };
    }
}
