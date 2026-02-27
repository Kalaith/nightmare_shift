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
        private readonly RouteService $routeService
    ) {}

    public function startShift(Request $request, Response $response): void
    {
        $userId = $this->getUserId($request, $response);
        if ($userId === null) return;

        try {
            $gameState = $this->startShiftAction->execute($userId);
            $response->success($gameState, 'Shift started');
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
            $response->success($gameState, 'Passenger assigned');
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
            $response->success($gameState, 'Route selected');
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
            $response->success($gameState, 'Interaction processed');
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
            $response->success($gameState, 'Ride completed');
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
                $response->success($gameState, 'Game loaded');
            }
        } catch (\Exception $e) {
            $response->error($e->getMessage(), 400);
        }
    }

    public function getRouteOptions(Request $request, Response $response): void
    {
        $userId = $this->getUserId($request, $response);
        if ($userId === null) return;

        $fuel = (float) ($request->query()['fuel'] ?? 100);
        $time = (float) ($request->query()['time'] ?? 600);

        try {
            $options = $this->routeService->getRouteOptions($fuel, $time);
            $response->success($options, 'Route options');
        } catch (\Exception $e) {
            $response->error($e->getMessage(), 400);
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

        // The auth_user 'id' is the WH user ID. We need the internal user ID.
        // For simplicity, we store it as an attribute after session validation.
        // In production, AuthMiddleware would look up the internal user ID.
        return (int) $authUser['id'];
    }
}
