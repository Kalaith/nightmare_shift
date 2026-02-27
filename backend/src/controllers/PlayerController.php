<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Actions\GetPlayerStatsAction;
use App\Actions\GetLeaderboardAction;
use App\Actions\GetAlmanacAction;

/**
 * Player controller — stats, leaderboard, and almanac.
 */
final class PlayerController
{
    public function __construct(
        private readonly GetPlayerStatsAction $getStatsAction,
        private readonly GetLeaderboardAction $getLeaderboardAction,
        private readonly GetAlmanacAction $getAlmanacAction
    ) {}

    public function getStats(Request $request, Response $response): void
    {
        $userId = $this->getUserId($request, $response);
        if ($userId === null) return;

        try {
            $stats = $this->getStatsAction->execute($userId);
            if ($stats === null) {
                $response->success([], 'No stats yet');
            } else {
                $response->success($stats, 'Player stats');
            }
        } catch (\Exception $e) {
            $response->error($e->getMessage(), 500);
        }
    }

    public function getLeaderboard(Request $request, Response $response): void
    {
        $limit = (int) ($request->query()['limit'] ?? 10);

        try {
            $leaderboard = $this->getLeaderboardAction->execute($limit);
            $response->success($leaderboard, 'Leaderboard');
        } catch (\Exception $e) {
            $response->error($e->getMessage(), 500);
        }
    }

    public function getAlmanac(Request $request, Response $response): void
    {
        $userId = $this->getUserId($request, $response);
        if ($userId === null) return;

        try {
            $almanac = $this->getAlmanacAction->execute($userId);
            $response->success($almanac, 'Almanac');
        } catch (\Exception $e) {
            $response->error($e->getMessage(), 500);
        }
    }

    private function getUserId(Request $request, Response $response): ?int
    {
        $authUser = $request->getAttribute('auth_user');
        if (!$authUser || empty($authUser['id'])) {
            $response->unauthorized();
            return null;
        }
        return (int) $authUser['id'];
    }
}
