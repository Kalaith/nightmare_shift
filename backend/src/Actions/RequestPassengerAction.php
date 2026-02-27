<?php
declare(strict_types=1);

namespace App\Actions;

use App\Services\PassengerService;
use App\Services\WeatherService;
use App\External\GameSaveRepository;

final class RequestPassengerAction
{
    public function __construct(
        private readonly PassengerService $passengerService,
        private readonly WeatherService $weatherService,
        private readonly GameSaveRepository $saveRepo
    ) {}

    /**
     * Select and assign the next passenger.
     *
     * @return array<string, mixed> Updated game state
     */
    public function execute(int $userId): array
    {
        $save = $this->saveRepo->findByUserId($userId);
        if ($save === null) {
            throw new \RuntimeException('No active game session');
        }

        $gameState = $save->game_state;
        $usedPassengers = $gameState['usedPassengers'] ?? [];
        $difficultyLevel = (int) ($gameState['difficultyLevel'] ?? 0);
        $weather = $gameState['currentWeather'] ?? [];
        $timeOfDay = $gameState['timeOfDay'] ?? [];
        $season = $gameState['season'] ?? [];

        // Select passenger with environmental awareness
        $passenger = !empty($weather)
            ? $this->passengerService->selectWeatherAwarePassenger($usedPassengers, $difficultyLevel, $weather, $timeOfDay, $season)
            : $this->passengerService->selectRandomPassenger($usedPassengers, $difficultyLevel);

        if ($passenger === null) {
            throw new \RuntimeException('No passengers available');
        }

        // Update game state
        $gameState['currentPassenger'] = $passenger;
        $gameState['gamePhase'] = 'rideRequest';
        $gameState['usedPassengers'][] = $passenger['id'];

        // Update weather
        $gameState['currentWeather'] = $this->weatherService->updateWeather(
            $weather,
            time(),
            $season
        );

        // Save
        $this->saveRepo->save($userId, $gameState);

        return $gameState;
    }
}
