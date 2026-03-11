<?php
declare(strict_types=1);

namespace App\Actions;

use App\External\GameSaveRepository;
use App\Services\GameEngineService;
use App\Services\GameSessionLogger;
use App\Services\ReputationService;
use App\Services\RouteService;
use App\Services\WeatherService;

final class HandleDrivingChoiceAction
{
    public function __construct(
        private readonly RouteService $routeService,
        private readonly ReputationService $reputationService,
        private readonly WeatherService $weatherService,
        private readonly GameEngineService $gameEngine,
        private readonly GameSaveRepository $saveRepo,
        private readonly GameSessionLogger $logger
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

        $gameState['rideProgress'] = $gameState['rideProgress'] ?? [
            'stepIndex' => 0,
            'sequence' => ['route', 'action', 'route', 'action', 'arrive'],
            'routeChoicesMade' => 0,
            'actionChoicesMade' => 0,
        ];

        $gameState['fuel'] = max(0, ($gameState['fuel'] ?? 0) - $costs['fuelCost']);
        $gameState['timeRemaining'] = max(0, ($gameState['timeRemaining'] ?? 0) - $costs['timeCost']);

        $gameState['routeHistory'][] = [
            'choice' => $routeType,
            'phase' => $phase,
            'fuelCost' => $costs['fuelCost'],
            'timeCost' => $costs['timeCost'],
            'riskLevel' => $costs['riskLevel'],
            'passenger' => $passenger['id'] ?? null,
            'timestamp' => time(),
        ];

        if (!isset($gameState['routeMastery'])) {
            $gameState['routeMastery'] = [];
        }
        $gameState['routeMastery'][$routeType] = ($gameState['routeMastery'][$routeType] ?? 0) + 1;

        if (($gameState['currentRide'] ?? null) === null) {
            $gameState['currentRide'] = [
                'passenger' => $passenger,
                'pickupLocation' => ['name' => $passenger['pickup'] ?? 'Unknown'],
                'destinationLocation' => ['name' => $passenger['destination'] ?? 'Unknown'],
                'startTime' => time(),
                'estimatedDuration' => (int) ($costs['timeCost'] * 2),
                'actualFare' => (float) ($passenger['fare'] ?? 10),
                'routeType' => $routeType,
            ];
        } else {
            $gameState['currentRide']['routeType'] = $routeType;
        }

        $result = [
            'choice' => $routeType,
            'violation' => false,
            'violatedRule' => null,
            'consequences' => [],
            'message' => null,
        ];

        if ($routeType === 'shortcut') {
            $violatedRule = $this->gameEngine->checkRuleViolation($gameState, 'take_shortcut');
            if ($violatedRule !== null) {
                $result['violation'] = true;
                $result['violatedRule'] = $violatedRule;
                $result['message'] = $violatedRule['violationMessage'] ?? 'Rule violated!';
                $gameState['rulesViolated'] = ($gameState['rulesViolated'] ?? 0) + 1;

                $applied = $this->gameEngine->applyConsequences(
                    $gameState,
                    $violatedRule['breakConsequences'] ?? []
                );
                $gameState = $applied['gameState'];
                $result['consequences'] = $applied['applied'];

                foreach ($result['consequences'] as $consequence) {
                    if (($consequence['type'] ?? '') === 'death') {
                        $gameState['gameOverReason'] = $result['message'];
                        break;
                    }
                }
            }
        }

        $gameState['rideProgress']['routeChoicesMade'] = (int) ($gameState['rideProgress']['routeChoicesMade'] ?? 0) + 1;
        $gameState['rideProgress']['stepIndex'] = min(4, (int) ($gameState['rideProgress']['stepIndex'] ?? 0) + 1);
        $gameState['currentDrivingPhase'] = $phase === 'pickup' ? 'destination' : $phase;
        $gameState['gamePhase'] = 'interaction';
        $gameState['pendingTipOffer'] = $this->maybeCreateTipOffer($passenger, $routeType, $gameState);

        $dialoguePool = $passenger['dialogue'] ?? [];
        $fallbackDialogue = empty($dialoguePool)
            ? 'The road stretches on in uneasy silence.'
            : $dialoguePool[array_rand($dialoguePool)];

        if ($gameState['pendingTipOffer'] !== null && !$result['violation']) {
            $fallbackDialogue = sprintf(
                'The passenger slides %s forward and offers a tip if you will take it.',
                $gameState['pendingTipOffer']['currency']
            );
        }

        $gameState['currentDialogue'] = [
            'text' => $result['message'] ?? $fallbackDialogue,
            'speaker' => $result['violation'] ? 'system' : 'passenger',
            'timestamp' => time(),
            'type' => $result['violation'] ? 'rule_related' : 'normal',
        ];
        $gameState['routeChoiceResult'] = $result;

        if (($gameState['fuel'] ?? 0) <= 0) {
            $gameState['gamePhase'] = 'gameOver';
            $gameState['gameOverReason'] = 'Out of fuel';
        }
        if (($gameState['timeRemaining'] ?? 0) <= 0) {
            $gameState['gamePhase'] = 'gameOver';
            $gameState['gameOverReason'] = 'Time expired';
        }

        if (($gameState['gamePhase'] ?? null) !== 'gameOver' && (random_int(0, 100) / 100) < $costs['riskLevel']) {
            $gameState['fuel'] = max(0, ($gameState['fuel'] ?? 0) - 5);
        }

        $this->saveRepo->save($userId, $gameState);
        $this->logger->log($userId, $gameState, 'route_selected', [
            'routeType' => $routeType,
            'phase' => $phase,
            'fuelCost' => $costs['fuelCost'],
            'timeCost' => $costs['timeCost'],
            'violation' => $result['violation'],
        ]);
        return $gameState;
    }

    private function maybeCreateTipOffer(array $passenger, string $routeType, array $gameState): ?array
    {
        if (($gameState['pendingTipOffer'] ?? null) !== null) {
            return $gameState['pendingTipOffer'];
        }

        $tipProfile = $passenger['tipProfile'] ?? null;
        if (!is_array($tipProfile)) {
            return null;
        }

        $requiredActions = $tipProfile['requiredActions'] ?? [];
        $lastInteractionAction = $gameState['interactionResult']['action'] ?? null;
        if (!empty($requiredActions) && !in_array($lastInteractionAction, $requiredActions, true)) {
            return null;
        }

        $chanceByRoute = $tipProfile['chanceByRoute'] ?? [];
        $chance = (int) ($chanceByRoute[$routeType] ?? 0);
        if (random_int(1, 100) > $chance) {
            return null;
        }

        $amountRange = $tipProfile['amountRange'] ?? ['min' => 1, 'max' => 1];
        $min = max(1, (int) ($amountRange['min'] ?? 1));
        $max = max($min, (int) ($amountRange['max'] ?? $min));
        $amount = random_int($min, $max);
        $currencyText = (string) ($tipProfile['currencyText'] ?? 'an offered tip');

        return [
            'offerId' => bin2hex(random_bytes(8)),
            'amount' => $amount,
            'currency' => $currencyText,
        ];
    }
}
