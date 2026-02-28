<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Actions\StartShiftAction;
use App\Actions\RequestPassengerAction;
use App\Actions\HandleDrivingChoiceAction;
use App\Actions\HandleInteractionAction;
use App\Actions\CompleteRideAction;
use App\Actions\EndShiftAction;
use App\Actions\SaveGameAction;
use App\Actions\LoadGameAction;
use App\Services\RouteService;
use App\Services\PassengerSanitizer;
use App\Repositories\RuleRepository;

/**
 * Game controller — thin HTTP handler for game lifecycle.
 * All business logic lives in Action classes.
 */
final class GameController
{
    public function __construct(
        private readonly StartShiftAction $startShiftAction,
        private readonly RequestPassengerAction $requestPassengerAction,
        private readonly HandleDrivingChoiceAction $handleDrivingChoiceAction,
        private readonly HandleInteractionAction $handleInteractionAction,
        private readonly CompleteRideAction $completeRideAction,
        private readonly EndShiftAction $endShiftAction,
        private readonly SaveGameAction $saveGameAction,
        private readonly LoadGameAction $loadGameAction,
        private readonly RouteService $routeService,
        private readonly RuleRepository $ruleRepository
    ) {}

    public function startShift(Request $request, Response $response): void
    {
        $userId = $this->getUserId($request, $response);
        if ($userId === null) return;

        try {
            $gameState = $this->startShiftAction->execute($userId);
            $response->success(PassengerSanitizer::sanitizeGameState($gameState), 'Shift started');
        } catch (\Exception $e) {
            $response->error($e->getMessage(), 400);
        }
    }

    public function requestPassenger(Request $request, Response $response): void
    {
        $userId = $this->getUserId($request, $response);
        if ($userId === null) return;

        try {
            $gameState = $this->requestPassengerAction->execute($userId);
            $response->success(PassengerSanitizer::sanitizeGameState($gameState), 'Passenger assigned');
        } catch (\Exception $e) {
            $response->error($e->getMessage(), 400);
        }
    }

    public function drivingChoice(Request $request, Response $response): void
    {
        $userId = $this->getUserId($request, $response);
        if ($userId === null) return;

        $data = $request->getParsedBody();
        $routeType = (string) ($data['routeType'] ?? 'normal');
        $phase = (string) ($data['phase'] ?? 'pickup');

        try {
            $gameState = $this->handleDrivingChoiceAction->execute($userId, $routeType, $phase);
            $response->success(PassengerSanitizer::sanitizeGameState($gameState), 'Route selected');
        } catch (\Exception $e) {
            $response->error($e->getMessage(), 400);
        }
    }

    public function interaction(Request $request, Response $response): void
    {
        $userId = $this->getUserId($request, $response);
        if ($userId === null) return;

        $data = $request->getParsedBody();
        $action = (string) ($data['action'] ?? '');

        if ($action === '') {
            $response->error('Action is required', 400);
            return;
        }

        try {
            $gameState = $this->handleInteractionAction->execute($userId, $action);
            $response->success(PassengerSanitizer::sanitizeGameState($gameState), 'Interaction processed');
        } catch (\Exception $e) {
            $response->error($e->getMessage(), 400);
        }
    }

    public function completeRide(Request $request, Response $response): void
    {
        $userId = $this->getUserId($request, $response);
        if ($userId === null) return;

        $data = $request->getParsedBody();
        $isPositive = (bool) ($data['isPositive'] ?? true);

        try {
            $gameState = $this->completeRideAction->execute($userId, $isPositive);
            $response->success(PassengerSanitizer::sanitizeGameState($gameState), 'Ride completed');
        } catch (\Exception $e) {
            $response->error($e->getMessage(), 400);
        }
    }

    public function endShift(Request $request, Response $response): void
    {
        $userId = $this->getUserId($request, $response);
        if ($userId === null) return;

        try {
            $result = $this->endShiftAction->execute($userId);
            $response->success($result, 'Shift ended');
        } catch (\Exception $e) {
            $response->error($e->getMessage(), 400);
        }
    }

    public function save(Request $request, Response $response): void
    {
        $userId = $this->getUserId($request, $response);
        if ($userId === null) return;

        $data = $request->getParsedBody();
        $gameState = $data['gameState'] ?? null;

        if ($gameState === null) {
            $response->error('Game state is required', 400);
            return;
        }

        try {
            $this->saveGameAction->execute($userId, $gameState);
            $response->success(null, 'Game saved');
        } catch (\Exception $e) {
            $response->error($e->getMessage(), 400);
        }
    }

    public function load(Request $request, Response $response): void
    {
        $userId = $this->getUserId($request, $response);
        if ($userId === null) return;

        try {
            $gameState = $this->loadGameAction->execute($userId);
            if ($gameState === null) {
                $response->success(null, 'No saved game');
            } else {
                $response->success(PassengerSanitizer::sanitizeGameState($gameState), 'Game loaded');
            }
        } catch (\Exception $e) {
            $response->error($e->getMessage(), 400);
        }
    }

    public function getRouteOptions(Request $request, Response $response): void
    {
        $userId = $this->getUserId($request, $response);
        if ($userId === null) return;

        try {
            $gameState = $this->loadGameAction->execute($userId);
            if ($gameState === null) {
                $response->error('No active game found', 400);
                return;
            }

            $fuel = (float) $gameState['fuel'];
            $time = (float) $gameState['timeRemaining'];
            $weather = $gameState['currentWeather'] ?? [];
            $timeOfDay = $gameState['timeOfDay'] ?? [];
            $hazards = $gameState['environmentalHazards'] ?? [];
            $routeMastery = $gameState['routeMastery'] ?? [];
            $passenger = $gameState['currentPassenger'] ?? null;
            
            // Assume default risk level of 1 for now, as location lookups might require LocationRepository
            $passengerRiskLevel = 1.0; 

            $options = $this->routeService->getRouteOptions(
                $fuel,
                $time,
                $passengerRiskLevel,
                $weather,
                $timeOfDay,
                $hazards,
                $routeMastery,
                $passenger
            );

            // Reformat dictionary to array and strip secrets
            $optionsArray = array_values($options);
            foreach ($optionsArray as &$opt) {
                unset($opt['riskLevel']);
                unset($opt['passengerReaction']);
                unset($opt['fareModifier']);
            }

            $response->success($optionsArray, 'Route options');
        } catch (\Exception $e) {
            $response->error($e->getMessage(), 400);
        }
    }

    public function getDailyRules(Request $request, Response $response): void
    {
        $userId = $this->getUserId($request, $response);
        if ($userId === null) return;

        try {
            // Get 3 random rules for tonight's shift
            $rules = $this->ruleRepository->getShiftRules(3);
            
            // Strip out secret fields before sending to client
            $safeRules = array_map(function($rule) {
                return [
                    'id' => $rule['id'],
                    'title' => $rule['title'],
                    'description' => $rule['description'],
                    'difficulty' => $rule['difficulty'] ?? 'easy',
                    'type' => $rule['type'] ?? 'basic',
                    'visible' => true
                ];
            }, $rules);

            $response->success($safeRules, 'Daily rules generated');
        } catch (\Exception $e) {
            $response->error($e->getMessage(), 500);
        }
    }

    /**
     * Extract the internal user ID from the auth context.
     * Returns null and sends 401 if not authenticated.
     */
    private function getUserId(Request $request, Response $response): ?int
    {
        $authUser = $request->getAttribute('auth_user');
        if (!$authUser || empty($authUser['id'])) {
            $response->unauthorized();
            return null;
        }

        // AuthMiddleware resolves the WH user ID to the internal users.id
        return (int) $authUser['id'];
    }
}
