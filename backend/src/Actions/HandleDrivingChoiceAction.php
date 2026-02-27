<?php
declare(strict_types=1);

namespace App\Actions;

use App\Services\RouteService;
use App\Services\ReputationService;
use App\Services\WeatherService;
use App\External\GameSaveRepository;

final class HandleDrivingChoiceAction
{
    public function __construct(
        private readonly RouteService $routeService,
        private readonly ReputationService $reputationService,
        private readonly WeatherService $weatherService,
        private readonly GameSaveRepository $saveRepo
    ) {}

    /**
     * Process a driving route choice.
     *
     * @return array<string, mixed> Updated game state
     */
    public function execute(int $userId, string $routeType, string $phase): array
    {
        $save = $this->saveRepo->findByUserId($userId);
        if ($save === null) {
            throw new \RuntimeException('No active game session');
        }

        $gameState = $save->game_state;
        $passenger = $gameState['currentPassenger'] ?? null;

        if ($passenger === null) {
            throw new \RuntimeException('No current passenger');
        }

        // Calculate route costs
        $weather = $gameState['currentWeather'] ?? [];
        $timeOfDay = $gameState['timeOfDay'] ?? [];
        $hazards = $gameState['environmentalHazards'] ?? [];
        $routeMastery = $gameState['routeMastery'] ?? [];

        $costs = $this->routeService->calculateRouteCosts(
            $routeType,
            1.0,
            $weather,
            $timeOfDay,
            $hazards,
            $routeMastery,
            $passenger
        );

        // Apply costs
        $gameState['fuel'] = max(0, ($gameState['fuel'] ?? 0) - $costs['fuelCost']);
        $gameState['timeRemaining'] = max(0, ($gameState['timeRemaining'] ?? 0) - $costs['timeCost']);

        // Record route choice
        $gameState['routeHistory'][] = [
            'choice' => $routeType,
            'phase' => $phase,
            'fuelCost' => $costs['fuelCost'],
            'timeCost' => $costs['timeCost'],
            'riskLevel' => $costs['riskLevel'],
            'passenger' => $passenger['id'] ?? null,
            'timestamp' => time(),
        ];

        // Track route mastery
        if (!isset($gameState['routeMastery'])) {
            $gameState['routeMastery'] = [];
        }
        $gameState['routeMastery'][$routeType] = ($gameState['routeMastery'][$routeType] ?? 0) + 1;

        // Update ride info
        if ($gameState['currentRide'] === null) {
            $gameState['currentRide'] = [
                'passenger' => $passenger,
                'pickupLocation' => ['name' => $passenger['pickup'] ?? 'Unknown'],
                'destinationLocation' => ['name' => $passenger['destination'] ?? 'Unknown'],
                'startTime' => time(),
                'estimatedDuration' => (int) $costs['timeCost'],
                'actualFare' => (float) ($passenger['fare'] ?? 10),
                'routeType' => $routeType,
            ];
        }

        // Update phase
        if ($phase === 'pickup') {
            $gameState['currentDrivingPhase'] = 'destination';
            $gameState['gamePhase'] = 'interaction';
        } else {
            $gameState['gamePhase'] = 'dropOff';
        }

        // Check for game over conditions
        if (($gameState['fuel'] ?? 0) <= 0) {
            $gameState['gamePhase'] = 'gameOver';
            $gameState['gameOverReason'] = 'Out of fuel';
        }
        if (($gameState['timeRemaining'] ?? 0) <= 0) {
            $gameState['gamePhase'] = 'gameOver';
            $gameState['gameOverReason'] = 'Time expired';
        }

        // Risk check
        if ((random_int(0, 100) / 100) < $costs['riskLevel']) {
            // Risk event occurred — minor penalty
            $gameState['fuel'] = max(0, ($gameState['fuel'] ?? 0) - 5);
        }

        $this->saveRepo->save($userId, $gameState);
        return $gameState;
    }
}
