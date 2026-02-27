<?php
declare(strict_types=1);

namespace App\Actions;

use App\Services\GameEngineService;
use App\Services\WeatherService;
use App\External\GameSaveRepository;
use App\External\PlayerStatsRepository;
use App\Data\Constants;

final class StartShiftAction
{
    public function __construct(
        private readonly GameEngineService $gameEngine,
        private readonly WeatherService $weatherService,
        private readonly GameSaveRepository $saveRepo,
        private readonly PlayerStatsRepository $statsRepo
    ) {}

    /**
     * Start a new shift — generate rules, weather, and initial game state.
     *
     * @return array<string, mixed>
     */
    public function execute(int $userId): array
    {
        // Get player stats for experience calculation
        $stats = $this->statsRepo->findByUserId($userId);
        $playerExperience = $stats
            ? $this->gameEngine->calculatePlayerExperience($stats->toArray())
            : 0;

        // Generate rules/guidelines
        $engineResult = $this->gameEngine->generateShiftRules($playerExperience);

        // Generate weather
        $season = $this->weatherService->getCurrentSeason();
        $weather = $this->weatherService->generateInitialWeather($season);
        $timeOfDay = $this->weatherService->updateTimeOfDay(time(), time());
        $hazards = $this->weatherService->generateEnvironmentalHazards($weather, $timeOfDay, $season);

        // Build initial game state
        $gameState = [
            'currentScreen' => Constants::SCREEN_GAME,
            'fuel' => Constants::INITIAL_FUEL,
            'earnings' => 0,
            'timeRemaining' => Constants::INITIAL_TIME,
            'ridesCompleted' => 0,
            'rulesViolated' => 0,
            'currentRules' => $engineResult['visibleRules'],
            'currentGuidelines' => $engineResult['guidelines'] ?? null,
            'hiddenRules' => $engineResult['hiddenRules'],
            'inventory' => [],
            'currentPassenger' => null,
            'currentRide' => null,
            'gamePhase' => Constants::PHASE_WAITING,
            'usedPassengers' => [],
            'shiftStartTime' => time(),
            'sessionStartTime' => time(),
            'difficultyLevel' => $engineResult['difficultyLevel'],
            'minimumEarnings' => Constants::MINIMUM_EARNINGS,
            'passengerReputation' => [],
            'routeHistory' => [],
            'currentWeather' => $weather,
            'timeOfDay' => $timeOfDay,
            'season' => $season,
            'environmentalHazards' => $hazards,
            'weatherEffects' => $weather['effects'] ?? [],
            'ruleConfidence' => 1.0,
            'completedRides' => [],
            'passengerBackstories' => [],
        ];

        // Update stats
        if ($stats) {
            $this->statsRepo->updateStats($userId, [
                'total_shifts_started' => $stats->total_shifts_started + 1,
            ]);
        }

        // Save game state
        $this->saveRepo->save($userId, $gameState);

        return $gameState;
    }
}
