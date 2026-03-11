<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Actions\GetPlayerStatsAction;
use App\Actions\GetLeaderboardAction;
use App\Actions\GetAlmanacAction;
use App\Actions\PurchaseSkillAction;
use App\Actions\UpgradeAlmanacAction;

/**
 * Player controller — stats, leaderboard, and almanac.
 */
final class PlayerController
{
    public function __construct(
        private readonly GetPlayerStatsAction $getStatsAction,
        private readonly GetLeaderboardAction $getLeaderboardAction,
        private readonly GetAlmanacAction $getAlmanacAction,
        private readonly PurchaseSkillAction $purchaseSkillAction,
        private readonly UpgradeAlmanacAction $upgradeAlmanacAction
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

    public function purchaseSkill(Request $request, Response $response): void
    {
        $userId = $this->getUserId($request, $response);
        if ($userId === null) return;

        $skillId = (string) $request->get('skill_id', '');
        if ($skillId === '') {
            $response->error('skill_id is required', 422);
            return;
        }

        try {
            $stats = $this->purchaseSkillAction->execute($userId, $skillId);
            $response->success($stats, 'Skill purchased');
        } catch (\Exception $e) {
            $response->error($e->getMessage(), 400);
        }
    }

    public function upgradeAlmanac(Request $request, Response $response): void
    {
        $userId = $this->getUserId($request, $response);
        if ($userId === null) return;

        $passengerId = (int) $request->get('passenger_id', 0);
        if ($passengerId <= 0) {
            $response->error('passenger_id is required', 422);
            return;
        }

        try {
            $stats = $this->upgradeAlmanacAction->execute($userId, $passengerId);
            $response->success($stats, 'Almanac upgraded');
        } catch (\Exception $e) {
            $response->error($e->getMessage(), 400);
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
